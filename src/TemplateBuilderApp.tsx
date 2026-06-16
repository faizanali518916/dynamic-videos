import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  LAYOUT_SPECS,
  defaultTheme,
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

type TemplateBuilderAppProps = {
  initialTemplate: InfographicTemplate;
};

export const TemplateBuilderApp = ({
  initialTemplate,
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
    initialTemplate.segments.map((segment) => ({
      ...toFormSegment(segment),
      videoShown: initialTemplate.videoBased === true && segment.videoShown === true,
    })),
  );
  const [copied, setCopied] = useState(false);

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
      await navigator.clipboard.writeText(json);
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

      <JsonPanel copied={copied} json={json} onCopy={() => void copyJson()} />
    </form>
  );
};
