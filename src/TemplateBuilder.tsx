import { AbsoluteFill } from "remotion";
import type { InfographicTemplate } from "./layoutCatalog";
import { TemplateBuilderApp } from "./TemplateBuilderApp";

type TemplateBuilderProps = {
  initialTemplate: InfographicTemplate;
};

export const TemplateBuilder = ({ initialTemplate }: TemplateBuilderProps) => (
  <AbsoluteFill className="builder-shell">
    <TemplateBuilderApp
      initialTemplate={initialTemplate}
      projectName="process-optimization"
    />
  </AbsoluteFill>
);
