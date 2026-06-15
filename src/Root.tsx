import "./index.css";
import { Composition } from "remotion";
import { InfographicVideo } from "./Composition";
import { TemplateBuilder } from "./TemplateBuilder";
import templateJson from "./template.json";
import {
  FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  getTemplateDurationInFrames,
  type InfographicTemplate,
} from "./layoutCatalog";

const infographicTemplate = templateJson as InfographicTemplate;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        component={InfographicVideo}
        defaultProps={{ template: infographicTemplate }}
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
        height={VIDEO_HEIGHT}
        id="TemplateBuilder"
        width={VIDEO_WIDTH}
      />
    </>
  );
};
