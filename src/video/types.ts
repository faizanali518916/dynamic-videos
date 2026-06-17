import type { CSSProperties } from "react";
import type {
  AnimationSegment,
  InfographicTemplate,
  Theme,
} from "../layoutCatalog";

export type TranscriptToken = {
  fromMs: number;
  text: string;
  toMs: number;
};

export type TranscriptPage = {
  durationMs: number;
  endMs: number;
  startMs: number;
  text: string;
  tokens: TranscriptToken[];
};

export type InfographicVideoProps = {
  mediaMode?: "preview" | "render";
  transcriptPages?: TranscriptPage[];
  template: InfographicTemplate;
  videoSrc?: string;
};

export type SegmentSceneProps = {
  durationInFrames: number;
  index: number;
  segment: AnimationSegment;
  template: InfographicTemplate;
  total: number;
};

export type LayoutProps = {
  accent: string;
  durationInFrames: number;
  frame: number;
  index: number;
  progress: number;
  segment: AnimationSegment;
  theme: Theme;
};

export type VisualStyle = CSSProperties;
