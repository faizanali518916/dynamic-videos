import { BRAND_COLORS } from "./brand";

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const FPS = 30;

export type LayoutKind =
  | "flowchart"
  | "barGraph"
  | "timeline"
  | "comparison"
  | "radial"
  | "matrix"
  | "stats"
  | "process"
  | "pyramid"
  | "roadmap"
  | "hierarchy"
  | "quadrant";

export type Theme = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  dark: string;
  accent: string;
  text: string;
  muted: string;
};

export type InfographicSegment = {
  layout: LayoutKind;
  title: string;
  subtitle?: string;
  body?: string;
  metric?: string;
  footnote?: string;
  accent?: string;
  items?: string[];
  values?: number[];
};

export type InfographicTemplate = {
  title: string;
  theme: Theme;
  segments: InfographicSegment[];
};

export type LayoutSpec = {
  label: string;
  durationSeconds: number;
  recommendedItems: number;
};

export const defaultTheme: Theme = {
  background: BRAND_COLORS.dark,
  surface: BRAND_COLORS.surface,
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  dark: BRAND_COLORS.dark,
  accent: BRAND_COLORS.primary,
  text: BRAND_COLORS.text,
  muted: BRAND_COLORS.muted,
};

export const LAYOUT_SPECS: Record<LayoutKind, LayoutSpec> = {
  flowchart: {
    label: "Flowchart",
    durationSeconds: 5,
    recommendedItems: 5,
  },
  barGraph: {
    label: "Bar graph",
    durationSeconds: 6,
    recommendedItems: 5,
  },
  timeline: {
    label: "Timeline",
    durationSeconds: 6,
    recommendedItems: 5,
  },
  comparison: {
    label: "Comparison",
    durationSeconds: 5,
    recommendedItems: 6,
  },
  radial: {
    label: "Radial map",
    durationSeconds: 6,
    recommendedItems: 6,
  },
  matrix: {
    label: "Matrix",
    durationSeconds: 5,
    recommendedItems: 4,
  },
  stats: {
    label: "Stats stack",
    durationSeconds: 5,
    recommendedItems: 4,
  },
  process: {
    label: "Process",
    durationSeconds: 6,
    recommendedItems: 5,
  },
  pyramid: {
    label: "Pyramid",
    durationSeconds: 5,
    recommendedItems: 5,
  },
  roadmap: {
    label: "Roadmap",
    durationSeconds: 6,
    recommendedItems: 5,
  },
  hierarchy: {
    label: "Hierarchy",
    durationSeconds: 6,
    recommendedItems: 7,
  },
  quadrant: {
    label: "Quadrant",
    durationSeconds: 5,
    recommendedItems: 4,
  },
};

export const layoutKinds = Object.keys(LAYOUT_SPECS) as LayoutKind[];

export const getSegmentDurationInFrames = (
  layout: LayoutKind,
  fps = FPS,
): number => Math.round(LAYOUT_SPECS[layout].durationSeconds * fps);

export const getTemplateDurationInFrames = (
  template: InfographicTemplate,
  fps = FPS,
): number => {
  const frames = template.segments.reduce(
    (sum, segment) => sum + getSegmentDurationInFrames(segment.layout, fps),
    0,
  );

  return Math.max(frames, fps * 5);
};
