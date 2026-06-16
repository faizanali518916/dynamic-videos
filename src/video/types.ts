import type { CSSProperties } from "react";
import type { Caption } from "@remotion/captions";
import type {
  AnimationSegment,
  InfographicTemplate,
  Theme,
} from "../layoutCatalog";

export type InfographicVideoProps = {
  captions?: Caption[];
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
