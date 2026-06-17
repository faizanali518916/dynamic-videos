import "./index.css";
import { Composition } from "remotion";
import { InfographicVideo } from "./Composition";
import { TemplateBuilder } from "./TemplateBuilder";
import templateJson from "./projects/process-optimization/template.json";
import tokensJson from "./projects/process-optimization/tokens.json";
import sourceVideo from "./projects/process-optimization/video.mp4";
import {
  FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  getTemplateDurationInFrames,
  type InfographicTemplate,
} from "./layoutCatalog";
import type { TranscriptPage } from "./video/types";

const infographicTemplate = templateJson as InfographicTemplate;
const transcriptPages = tokensJson as TranscriptPage[];
const BUILDER_WIDTH = 1600;
const BUILDER_HEIGHT = 1200;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        component={InfographicVideo}
        defaultProps={{
          transcriptPages,
          template: infographicTemplate,
          videoSrc: sourceVideo,
        }}
        durationInFrames={getTemplateDurationInFrames(infographicTemplate, FPS)}
        fps={FPS}
        height={VIDEO_HEIGHT}
        id="InfographicVideo"
        width={VIDEO_WIDTH}
      />
      <Composition
        component={TemplateBuilder}
        defaultProps={{ initialTemplate: infographicTemplate }}
        durationInFrames={FPS * 10}
        fps={FPS}
        height={BUILDER_HEIGHT}
        id="TemplateBuilder"
        width={BUILDER_WIDTH}
      />
    </>
  );
};
