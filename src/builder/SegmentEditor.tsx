import { LAYOUT_SPECS, layoutKinds, type Theme } from "../layoutCatalog";
import type { FormSegment } from "./types";

type SegmentEditorProps = {
  index: number;
  onDuplicate: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, key: keyof FormSegment, value: string) => void;
  segment: FormSegment;
  segmentCount: number;
  theme: Theme;
};

export const SegmentEditor = ({
  index,
  onDuplicate,
  onMove,
  onRemove,
  onUpdate,
  segment,
  segmentCount,
  theme,
}: SegmentEditorProps) => (
  <article className="segment-editor">
    <div className="segment-toolbar">
      <strong>Segment {index + 1}</strong>
      <div>
        <button disabled={index === 0} onClick={() => onMove(index, -1)} type="button">
          Up
        </button>
        <button
          disabled={index === segmentCount - 1}
          onClick={() => onMove(index, 1)}
          type="button"
        >
          Down
        </button>
        <button onClick={() => onDuplicate(index)} type="button">
          Duplicate
        </button>
        <button onClick={() => onRemove(index)} type="button">
          Remove
        </button>
      </div>
    </div>

    <div className="segment-fields">
      <label className="builder-field">
        <span>Layout</span>
        <select
          onChange={(event) => onUpdate(index, "layout", event.target.value)}
          value={segment.layout}
        >
          {layoutKinds.map((layout) => (
            <option key={layout} value={layout}>
              {LAYOUT_SPECS[layout].label} / {LAYOUT_SPECS[layout].durationSeconds}s
            </option>
          ))}
        </select>
      </label>

      <label className="builder-field">
        <span>Accent</span>
        <input
          onChange={(event) => onUpdate(index, "accent", event.target.value)}
          type="color"
          value={segment.accent || theme.accent}
        />
      </label>

      <label className="builder-field wide">
        <span>Title</span>
        <input
          onChange={(event) => onUpdate(index, "title", event.target.value)}
          type="text"
          value={segment.title}
        />
      </label>

      <label className="builder-field wide">
        <span>Subtitle</span>
        <input
          onChange={(event) => onUpdate(index, "subtitle", event.target.value)}
          type="text"
          value={segment.subtitle}
        />
      </label>

      <label className="builder-field">
        <span>Metric</span>
        <input
          onChange={(event) => onUpdate(index, "metric", event.target.value)}
          type="text"
          value={segment.metric}
        />
      </label>

      <label className="builder-field">
        <span>Values</span>
        <input
          onChange={(event) => onUpdate(index, "valuesText", event.target.value)}
          placeholder="80, 55, 90"
          type="text"
          value={segment.valuesText}
        />
      </label>

      <label className="builder-field wide">
        <span>Items</span>
        <textarea
          onChange={(event) => onUpdate(index, "itemsText", event.target.value)}
          rows={5}
          value={segment.itemsText}
        />
      </label>

      <label className="builder-field wide">
        <span>Body</span>
        <textarea
          onChange={(event) => onUpdate(index, "body", event.target.value)}
          rows={3}
          value={segment.body}
        />
      </label>

      <label className="builder-field wide">
        <span>Footnote</span>
        <input
          onChange={(event) => onUpdate(index, "footnote", event.target.value)}
          type="text"
          value={segment.footnote}
        />
      </label>
    </div>
  </article>
);
