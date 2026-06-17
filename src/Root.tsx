import "./index.css";
import { Composition } from "remotion";
import { InfographicVideo } from "./Composition";
import { projectRegistry } from "./generated/projectRegistry";
import {
  FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  getTemplateDurationInFrames,
} from "./layoutCatalog";

export const RemotionRoot: React.FC = () => {
  if (projectRegistry.length === 0) {
    throw new Error("No projects with template.json were found in src/projects.");
  }

  return (
    <>
      {projectRegistry.map((project) => (
        <Composition
          calculateMetadata={({ props }) => ({
            durationInFrames: getTemplateDurationInFrames(props.template, FPS),
          })}
          component={InfographicVideo}
          defaultProps={{
            transcriptPages: project.transcriptPages,
            template: project.template,
            videoSrc: project.videoSrc,
          }}
          durationInFrames={getTemplateDurationInFrames(project.template, FPS)}
          fps={FPS}
          height={VIDEO_HEIGHT}
          id={project.name}
          key={project.name}
          width={VIDEO_WIDTH}
        />
      ))}
    </>
  );
};
