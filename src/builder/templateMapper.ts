import {
  LAYOUT_SPECS,
  getSegmentDurationSeconds,
  type InfographicSegment,
  type InfographicTemplate,
  type LayoutKind,
  type Theme,
  isVideoShownSegment,
} from "../layoutCatalog";
import type { FormSegment } from "./types";

const defaultItems = [
  "First point",
  "Second point",
  "Third point",
  "Fourth point",
  "Fifth point",
  "Sixth point",
  "Seventh point",
];

const defaultLayout: LayoutKind = "flowchart";

export const toFormSegment = (segment: InfographicSegment): FormSegment => {
  if (isVideoShownSegment(segment)) {
    return {
      accent: "",
      body: "",
      durationSeconds: String(getSegmentDurationSeconds(segment)),
      footnote: "",
      itemsText: "",
      layout: defaultLayout,
      metric: "",
      subtitle: "",
      title: LAYOUT_SPECS[defaultLayout].label,
      valuesText: "",
      videoShown: true,
    };
  }

  return {
    accent: segment.accent ?? "",
    body: segment.body ?? "",
    durationSeconds: String(getSegmentDurationSeconds(segment)),
    footnote: segment.footnote ?? "",
    itemsText: (segment.items ?? []).join("\n"),
    layout: segment.layout,
    metric: segment.metric ?? "",
    subtitle: segment.subtitle ?? "",
    title: segment.title,
    valuesText: (segment.values ?? []).join(", "),
    videoShown: false,
  };
};

export const newSegment = (layout: LayoutKind = "flowchart"): FormSegment => ({
  accent: "",
  body: "",
  durationSeconds: String(LAYOUT_SPECS[layout].durationSeconds),
  footnote: "",
  itemsText: defaultItems
    .slice(0, LAYOUT_SPECS[layout].recommendedItems)
    .join("\n"),
  layout,
  metric: "",
  subtitle: "",
  title: LAYOUT_SPECS[layout].label,
  valuesText: "",
  videoShown: false,
});

const parseItems = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseValues = (value: string): number[] =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

const parseDurationSeconds = (layout: LayoutKind, value: string): number =>
  getSegmentDurationSeconds({
    durationSeconds: Number(value),
    layout,
    title: LAYOUT_SPECS[layout].label,
  });

const parseVideoDurationSeconds = (value: string): number =>
  getSegmentDurationSeconds({
    durationSeconds: Number(value),
    videoShown: true,
  });

export const toTemplate = (
  title: string,
  hookText: string,
  intro: boolean,
  outro: boolean,
  caption: boolean,
  theme: Theme,
  videoBased: boolean,
  segments: FormSegment[],
): InfographicTemplate => ({
  title: title.trim() || "Untitled infographic",
  intro,
  outro,
  videoBased,
  caption: videoBased && caption,
  theme,
  ...(intro && hookText.trim() ? { hookText: hookText.trim() } : {}),
  segments: segments.map((segment) => {
    if (videoBased && segment.videoShown) {
      return {
        videoShown: true,
        durationSeconds: parseVideoDurationSeconds(segment.durationSeconds),
      };
    }

    return {
      videoShown: false,
      layout: segment.layout,
      title: segment.title.trim() || LAYOUT_SPECS[segment.layout].label,
      durationSeconds: parseDurationSeconds(
        segment.layout,
        segment.durationSeconds,
      ),
      ...(segment.subtitle.trim() ? { subtitle: segment.subtitle.trim() } : {}),
      ...(segment.body.trim() ? { body: segment.body.trim() } : {}),
      ...(segment.metric.trim() ? { metric: segment.metric.trim() } : {}),
      ...(segment.footnote.trim() ? { footnote: segment.footnote.trim() } : {}),
      ...(segment.accent.trim() ? { accent: segment.accent.trim() } : {}),
      ...(parseItems(segment.itemsText).length > 0
        ? { items: parseItems(segment.itemsText) }
        : {}),
      ...(parseValues(segment.valuesText).length > 0
        ? { values: parseValues(segment.valuesText) }
        : {}),
    };
  }),
});
