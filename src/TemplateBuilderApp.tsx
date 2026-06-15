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
import { newSegment, toFormSegment, toTemplate } from "./builder/templateMapper";
import type { FormSegment } from "./builder/types";

type TemplateBuilderAppProps = {
  initialTemplate: InfographicTemplate;
};

export const TemplateBuilderApp = ({
  initialTemplate,
}: TemplateBuilderAppProps) => {
  const [title, setTitle] = useState(initialTemplate.title);
  const [theme, setTheme] = useState<Theme>({
    ...defaultTheme,
    ...initialTemplate.theme,
  });
  const [segments, setSegments] = useState<FormSegment[]>(
    initialTemplate.segments.map(toFormSegment),
  );
  const [copied, setCopied] = useState(false);

  const template = useMemo(
    () => toTemplate(title, theme, segments),
    [title, theme, segments],
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
    value: string,
  ) => {
    setSegments((current) =>
      current.map((segment, segmentIndex) =>
        segmentIndex === index
          ? {
              ...segment,
              [key]: value,
              ...(key === "layout" && !segment.title.trim()
                ? { title: LAYOUT_SPECS[value as LayoutKind].label }
                : {}),
            }
          : segment,
      ),
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

  return (
    <form className="builder-grid" onSubmit={handleSubmit}>
      <section className="builder-main">
        <BuilderHeader copied={copied} />

        <label className="builder-field">
          <span>Template title</span>
          <input onChange={handleTitleChange} type="text" value={title} />
        </label>

        <ThemeEditor onChange={updateTheme} theme={theme} />

        <div className="segments-header">
          <h2>Segments</h2>
          <button className="builder-secondary" onClick={addSegment} type="button">
            Add segment
          </button>
        </div>

        <div className="segments-list">
          {segments.map((segment, index) => (
            <SegmentEditor
              index={index}
              key={`${segment.layout}-${index}`}
              onDuplicate={duplicateSegment}
              onMove={moveSegment}
              onRemove={removeSegment}
              onUpdate={updateSegment}
              segment={segment}
              segmentCount={segments.length}
              theme={theme}
            />
          ))}
        </div>
      </section>

      <JsonPanel copied={copied} json={json} onCopy={() => void copyJson()} />
    </form>
  );
};
