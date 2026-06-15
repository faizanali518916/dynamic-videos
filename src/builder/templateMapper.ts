import {
  LAYOUT_SPECS,
  type InfographicSegment,
  type InfographicTemplate,
  type LayoutKind,
  type Theme,
} from "../layoutCatalog";
import type { FormSegment } from "./types";

export const toFormSegment = (segment: InfographicSegment): FormSegment => ({
  accent: segment.accent ?? "",
  body: segment.body ?? "",
  footnote: segment.footnote ?? "",
  itemsText: (segment.items ?? []).join("\n"),
  layout: segment.layout,
  metric: segment.metric ?? "",
  subtitle: segment.subtitle ?? "",
  title: segment.title,
  valuesText: (segment.values ?? []).join(", "),
});

export const newSegment = (layout: LayoutKind = "flowchart"): FormSegment => ({
  accent: "",
  body: "",
  footnote: "",
  itemsText: ["First point", "Second point", "Third point"].join("\n"),
  layout,
  metric: "",
  subtitle: "",
  title: LAYOUT_SPECS[layout].label,
  valuesText: "",
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

export const toTemplate = (
  title: string,
  theme: Theme,
  segments: FormSegment[],
): InfographicTemplate => ({
  title: title.trim() || "Untitled infographic",
  theme,
  segments: segments.map((segment) => ({
    layout: segment.layout,
    title: segment.title.trim() || LAYOUT_SPECS[segment.layout].label,
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
  })),
});
