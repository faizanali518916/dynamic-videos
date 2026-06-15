import { LAYOUT_SPECS, type InfographicSegment, type InfographicTemplate, type Theme } from "../../layoutCatalog";
import { HighlightTag } from "../primitives/HighlightTag";

type SceneHeaderProps = {
  accent: string;
  index: number;
  segment: InfographicSegment;
  template: InfographicTemplate;
  theme: Theme;
  total: number;
};

export const SceneHeader = ({
  accent,
  index,
  segment,
  template,
  theme,
  total,
}: SceneHeaderProps) => (
  <header
    style={{
      alignItems: "center",
      color: theme.muted,
      display: "flex",
      fontSize: 21,
      fontWeight: 850,
      justifyContent: "space-between",
      letterSpacing: 0,
      position: "relative",
      textTransform: "uppercase",
      zIndex: 2,
    }}
  >
    <span style={{ color: theme.text }}>{template.title}</span>
    <HighlightTag accent={accent} theme={theme}>
      {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} -{" "}
      {LAYOUT_SPECS[segment.layout].durationSeconds}s
    </HighlightTag>
  </header>
);
