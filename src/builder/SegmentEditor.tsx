import {
  LAYOUT_SPECS,
  MAX_VIDEO_SCENE_DURATION_SECONDS,
  MIN_VIDEO_SCENE_DURATION_SECONDS,
  layoutKinds,
  type LayoutKind,
  type Theme,
} from "../layoutCatalog";
import type { FormSegment } from "./types";

type SegmentEditorProps = {
  index: number;
  onDuplicate: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    key: keyof FormSegment,
    value: FormSegment[keyof FormSegment],
  ) => void;
  segment: FormSegment;
  segmentCount: number;
  theme: Theme;
  videoBased: boolean;
};

const itemCountLabel = (layout: LayoutKind): string => {
  const spec = LAYOUT_SPECS[layout];

  return spec.minItems === spec.maxItems
    ? `${spec.minItems} items`
    : `${spec.minItems}-${spec.maxItems} items`;
};

const durationRangeLabel = (layout: LayoutKind): string => {
  const spec = LAYOUT_SPECS[layout];

  return `${spec.minDurationSeconds}-${spec.maxDurationSeconds}s`;
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
  videoBased,
}: SegmentEditorProps) => {
  const spec = LAYOUT_SPECS[segment.layout];
  const durationLabel = segment.videoShown
    ? "Duration"
    : `Duration (${durationRangeLabel(segment.layout)})`;
  const minDuration = segment.videoShown
    ? MIN_VIDEO_SCENE_DURATION_SECONDS
    : spec.minDurationSeconds;
  const maxDuration = segment.videoShown
    ? MAX_VIDEO_SCENE_DURATION_SECONDS
    : spec.maxDurationSeconds;

  return (
    <article className="segment-editor">
      <div className="segment-toolbar">
        <strong>Segment {index + 1}</strong>
        <div>
          <button
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            type="button"
          >
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
        <label className="builder-field builder-toggle">
          <input
            checked={segment.videoShown}
            disabled={!videoBased}
            onChange={(event) =>
              onUpdate(index, "videoShown", event.target.checked)
            }
            type="checkbox"
          />
          <span>Video shown</span>
        </label>

        <label className="builder-field">
          <span>{durationLabel}</span>
          <input
            max={maxDuration}
            min={minDuration}
            onChange={(event) =>
              onUpdate(index, "durationSeconds", event.target.value)
            }
            step={0.25}
            type="number"
            value={segment.durationSeconds}
          />
        </label>

        {segment.videoShown ? null : (
          <>
            <label className="builder-field">
              <span>Layout</span>
              <select
                onChange={(event) =>
                  onUpdate(index, "layout", event.target.value)
                }
                value={segment.layout}
              >
                {layoutKinds.map((layout) => (
                  <option key={layout} value={layout}>
                    {LAYOUT_SPECS[layout].label} / {itemCountLabel(layout)} /{" "}
                    {durationRangeLabel(layout)}
                  </option>
                ))}
              </select>
            </label>

            <label className="builder-field">
              <span>Accent</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "accent", event.target.value)
                }
                type="color"
                value={segment.accent || theme.accent}
              />
            </label>

            <label className="builder-field wide">
              <span>Title</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "title", event.target.value)
                }
                type="text"
                value={segment.title}
              />
            </label>

            <label className="builder-field wide">
              <span>Subtitle</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "subtitle", event.target.value)
                }
                type="text"
                value={segment.subtitle}
              />
            </label>

            <label className="builder-field">
              <span>Metric</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "metric", event.target.value)
                }
                type="text"
                value={segment.metric}
              />
            </label>

            <label className="builder-field">
              <span>Values</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "valuesText", event.target.value)
                }
                placeholder="80, 55, 90"
                type="text"
                value={segment.valuesText}
              />
            </label>

            <label className="builder-field wide">
              <span>Items ({itemCountLabel(segment.layout)})</span>
              <textarea
                onChange={(event) =>
                  onUpdate(index, "itemsText", event.target.value)
                }
                rows={Math.min(spec.maxItems, 7)}
                value={segment.itemsText}
              />
            </label>

            <label className="builder-field wide">
              <span>Body</span>
              <textarea
                onChange={(event) =>
                  onUpdate(index, "body", event.target.value)
                }
                rows={3}
                value={segment.body}
              />
            </label>

            <label className="builder-field wide">
              <span>Footnote</span>
              <input
                onChange={(event) =>
                  onUpdate(index, "footnote", event.target.value)
                }
                type="text"
                value={segment.footnote}
              />
            </label>
          </>
        )}
      </div>
    </article>
  );
};
