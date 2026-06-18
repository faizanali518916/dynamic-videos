import { Player } from "@remotion/player";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  FPS,
  LAYOUT_SPECS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  defaultTheme,
  getTemplateDurationInFrames,
  type InfographicTemplate,
  type LayoutKind,
  type Theme,
} from "./layoutCatalog";
import { BuilderHeader } from "./builder/BuilderHeader";
import { JsonPanel } from "./builder/JsonPanel";
import { SegmentEditor } from "./builder/SegmentEditor";
import { ThemeEditor } from "./builder/ThemeEditor";
import {
  newSegment,
  toFormSegment,
  toTemplate,
} from "./builder/templateMapper";
import type { FormSegment } from "./builder/types";
import { InfographicVideo } from "./video/InfographicVideo";
import type { TranscriptPage } from "./video/types";

type TemplateBuilderAppProps = {
  initialTemplate: InfographicTemplate;
  projectName: string;
  previewVideoSrc?: string;
  transcriptPages?: TranscriptPage[];
};

type RenderStatus = "idle" | "submitting" | "queued" | "error";

const templateToFormSegments = (template: InfographicTemplate): FormSegment[] =>
  template.segments.map((segment) => ({
    ...toFormSegment(segment),
    videoShown: template.videoBased === true && segment.videoShown === true,
  }));

const parseTemplateJson = (value: string): InfographicTemplate => {
  const parsed = JSON.parse(value) as Partial<InfographicTemplate>;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON must be an object.");
  }

  if (typeof parsed.title !== "string") {
    throw new Error("JSON must include a string title.");
  }

  if (!parsed.theme || typeof parsed.theme !== "object") {
    throw new Error("JSON must include a theme object.");
  }

  if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
    throw new Error("JSON must include at least one segment.");
  }

  return parsed as InfographicTemplate;
};

export const TemplateBuilderApp = ({
  initialTemplate,
  projectName,
  previewVideoSrc,
  transcriptPages = [],
}: TemplateBuilderAppProps) => {
  const [title, setTitle] = useState(initialTemplate.title);
  const [hookText, setHookText] = useState(initialTemplate.hookText ?? "");
  const [intro, setIntro] = useState(initialTemplate.intro === true);
  const [outro, setOutro] = useState(initialTemplate.outro === true);
  const [videoBased, setVideoBased] = useState(
    initialTemplate.videoBased === true,
  );
  const [caption, setCaption] = useState(
    initialTemplate.videoBased === true && initialTemplate.caption === true,
  );
  const [theme, setTheme] = useState<Theme>({
    ...defaultTheme,
    ...initialTemplate.theme,
  });
  const [segments, setSegments] = useState<FormSegment[]>(
    templateToFormSegments(initialTemplate),
  );
  const [copied, setCopied] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(() =>
    JSON.stringify(initialTemplate, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [renderEmail, setRenderEmail] = useState("");
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [renderMessage, setRenderMessage] = useState("");

  const template = useMemo(
    () =>
      toTemplate(
        title,
        hookText,
        intro,
        outro,
        caption,
        theme,
        videoBased,
        segments,
      ),
    [title, hookText, intro, outro, caption, theme, videoBased, segments],
  );
  const json = useMemo(() => JSON.stringify(template, null, 2), [template]);
  const previewDurationInFrames = useMemo(
    () => getTemplateDurationInFrames(template, FPS),
    [template],
  );
  const previewDurationSeconds = useMemo(
    () => Math.round(previewDurationInFrames / FPS),
    [previewDurationInFrames],
  );

  useEffect(() => {
    setJsonDraft(json);
    setJsonError(null);
  }, [json]);

  const applyTemplate = (nextTemplate: InfographicTemplate) => {
    setTitle(nextTemplate.title);
    setHookText(nextTemplate.hookText ?? "");
    setIntro(nextTemplate.intro === true);
    setOutro(nextTemplate.outro === true);
    setVideoBased(nextTemplate.videoBased === true);
    setCaption(
      nextTemplate.videoBased === true && nextTemplate.caption === true,
    );
    setTheme({ ...defaultTheme, ...nextTemplate.theme });
    setSegments(templateToFormSegments(nextTemplate));
    setCopied(false);
  };

  const updateTheme = (key: keyof Theme, value: string) => {
    setTheme((current) => ({
      ...current,
      [key]: value,
    }));
    setCopied(false);
  };

  const updateSegment = (
    index: number,
    key: keyof FormSegment,
    value: FormSegment[keyof FormSegment],
  ) => {
    setSegments((current) =>
      current.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment;
        }

        if (key === "layout") {
          const layout = String(value) as LayoutKind;

          return {
            ...segment,
            layout,
            durationSeconds: String(LAYOUT_SPECS[layout].durationSeconds),
            ...(!segment.title.trim()
              ? { title: LAYOUT_SPECS[layout].label }
              : {}),
          };
        }

        return {
          ...segment,
          [key]: value,
        };
      }),
    );
    setCopied(false);
  };

  const moveSegment = (index: number, direction: -1 | 1) => {
    setSegments((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
    setCopied(false);
  };

  const duplicateSegment = (index: number) => {
    setSegments((current) => {
      const next = [...current];
      next.splice(index + 1, 0, { ...current[index] });
      return next;
    });
    setCopied(false);
  };

  const removeSegment = (index: number) => {
    setSegments((current) =>
      current.filter((_, segmentIndex) => segmentIndex !== index),
    );
    setCopied(false);
  };

  const addSegment = () => {
    setSegments((current) => [...current, newSegment("flowchart")]);
    setCopied(false);
  };

  const copyJson = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(jsonDraft);
      setCopied(true);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void copyJson();
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    setCopied(false);
  };

  const handleHookTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHookText(event.target.value);
    setCopied(false);
  };

  const handleJsonChange = (value: string) => {
    setJsonDraft(value);
    setCopied(false);
    setRenderStatus("idle");
    setRenderMessage("");

    try {
      const nextTemplate = parseTemplateJson(value);
      setJsonError(null);
      applyTemplate(nextTemplate);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
    }
  };

  const handleRenderEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRenderEmail(event.target.value);
    setRenderStatus("idle");
    setRenderMessage("");
  };

  const handleIntroChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIntro(event.target.checked);
    setCopied(false);
  };

  const handleOutroChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOutro(event.target.checked);
    setCopied(false);
  };

  const handleVideoBasedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextVideoBased = event.target.checked;

    setVideoBased(nextVideoBased);
    if (!nextVideoBased) {
      setCaption(false);
      setSegments((current) =>
        current.map((segment) => ({
          ...segment,
          videoShown: false,
        })),
      );
    }
    setCopied(false);
  };

  const handleCaptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCaption(event.target.checked);
    setCopied(false);
  };

  const requestRender = async () => {
    if (jsonError) {
      setRenderStatus("error");
      setRenderMessage("Fix the JSON before requesting a render.");
      return;
    }

    setRenderStatus("submitting");
    setRenderMessage("");

    try {
      const response = await fetch("/api/render-jobs", {
        body: JSON.stringify({
          email: renderEmail,
          projectName,
          template,
          transcriptPages,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        jobId?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Render request failed.");
      }

      setRenderStatus("queued");
      setRenderMessage(
        result.message ??
          `Render queued. The Drive link will be emailed to ${renderEmail}.`,
      );
    } catch (error) {
      setRenderStatus("error");
      setRenderMessage(
        error instanceof Error ? error.message : "Render request failed.",
      );
    }
  };

  return (
    <form className="builder-grid" onSubmit={handleSubmit}>
      <section className="builder-main">
        <BuilderHeader copied={copied} />

        <div className="builder-settings">
          <div className="builder-toggle-grid">
            <label className="builder-field builder-toggle">
              <input
                checked={intro}
                onChange={handleIntroChange}
                type="checkbox"
              />
              <span>Intro</span>
            </label>

            <label className="builder-field builder-toggle">
              <input
                checked={videoBased}
                onChange={handleVideoBasedChange}
                type="checkbox"
              />
              <span>Video</span>
            </label>

            <label className="builder-field builder-toggle">
              <input
                checked={outro}
                onChange={handleOutroChange}
                type="checkbox"
              />
              <span>Outro</span>
            </label>

            <label className="builder-field builder-toggle">
              <input
                checked={caption}
                disabled={!videoBased}
                onChange={handleCaptionChange}
                type="checkbox"
              />
              <span>Caption</span>
            </label>
          </div>

          <label className={`builder-field ${intro ? "" : "title-field-wide"}`}>
            <span>Template title</span>
            <input onChange={handleTitleChange} type="text" value={title} />
          </label>

          {intro ? (
            <label className="builder-field hook-field">
              <span>Hook text</span>
              <input
                onChange={handleHookTextChange}
                required
                type="text"
                value={hookText}
              />
            </label>
          ) : null}
        </div>

        <ThemeEditor onChange={updateTheme} theme={theme} />

        <div className="segments-header">
          <h2>Segments</h2>
          <button
            className="builder-secondary"
            onClick={addSegment}
            type="button"
          >
            Add segment
          </button>
        </div>

        <div className="segments-list">
          {segments.map((segment, index) => (
            <SegmentEditor
              index={index}
              key={`${segment.videoShown ? "video" : segment.layout}-${index}`}
              onDuplicate={duplicateSegment}
              onMove={moveSegment}
              onRemove={removeSegment}
              onUpdate={updateSegment}
              segment={segment}
              segmentCount={segments.length}
              theme={theme}
              videoBased={videoBased}
            />
          ))}
        </div>
      </section>

      <aside className="preview-panel">
        <div className="preview-metrics" aria-label="Preview metrics">
          <div className="preview-metric">
            <span>FPS</span>
            <strong>{FPS}</strong>
          </div>
          <div className="preview-metric">
            <span>frames</span>
            <strong>{previewDurationInFrames.toLocaleString()}</strong>
          </div>
          <div className="preview-metric">
            <span>duration</span>
            <strong>{previewDurationSeconds}s</strong>
          </div>
        </div>
        <div className="preview-frame">
          <Player
            component={InfographicVideo}
            compositionHeight={VIDEO_HEIGHT}
            compositionWidth={VIDEO_WIDTH}
            controls
            durationInFrames={previewDurationInFrames}
            fps={FPS}
            inputProps={{
              mediaMode: "preview",
              template,
              transcriptPages,
              videoSrc: previewVideoSrc,
            }}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
        </div>

        <div className="render-card">
          <label className="builder-field">
            <span>Email completion link</span>
            <input
              onChange={handleRenderEmailChange}
              placeholder="name@example.com"
              required
              type="email"
              value={renderEmail}
            />
          </label>
          <button
            className="builder-primary"
            disabled={renderStatus === "submitting" || Boolean(jsonError)}
            onClick={() => void requestRender()}
            type="button"
          >
            {renderStatus === "submitting" ? "Queuing" : "Render video"}
          </button>
          {renderMessage ? (
            <p className={`render-message ${renderStatus}`}>{renderMessage}</p>
          ) : null}
        </div>

        <JsonPanel
          copied={copied}
          json={jsonDraft}
          jsonError={jsonError}
          onCopy={() => void copyJson()}
          onJsonChange={handleJsonChange}
        />
      </aside>
    </form>
  );
};
