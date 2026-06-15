import type { CSSProperties } from "react";
import type { InfographicSegment, InfographicTemplate, Theme } from "../layoutCatalog";

export type InfographicVideoProps = {
  template: InfographicTemplate;
};

export type SegmentSceneProps = {
  durationInFrames: number;
  index: number;
  segment: InfographicSegment;
  template: InfographicTemplate;
  total: number;
};

export type LayoutProps = {
  accent: string;
  durationInFrames: number;
  frame: number;
  index: number;
  progress: number;
  segment: InfographicSegment;
  theme: Theme;
};

export type VisualStyle = CSSProperties;
