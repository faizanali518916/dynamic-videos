import { GlowCard } from "../primitives/GlowCard";
import { HighlightTag } from "../primitives/HighlightTag";
import type { LayoutProps } from "../types";
import {
  ensureItems,
  enterStyle,
  headingTextStyle,
  reveal,
  vividGradient,
  withAlpha,
} from "../utils";

export const QuadrantLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);
  const labels = ["Spark", "Launch", "Tune", "Pause"];

  return (
    <div style={{ height: 760, position: "relative", width: "100%" }}>
      <div
        style={{
          background: vividGradient(theme, accent),
          height: 5,
          left: 0,
          opacity: 0.48,
          position: "absolute",
          right: 0,
          top: "50%",
        }}
      />
      <div
        style={{
          background: vividGradient(theme, accent),
          bottom: 0,
          left: "50%",
          opacity: 0.48,
          position: "absolute",
          top: 0,
          width: 5,
        }}
      />
      <div
        style={{
          color: withAlpha(theme.text, 0.42),
          fontSize: 22,
          fontWeight: 900,
          left: 12,
          position: "absolute",
          top: 8,
          textTransform: "uppercase",
        }}
      >
        Value
      </div>
      <div
        style={{
          bottom: 8,
          color: withAlpha(theme.text, 0.42),
          fontSize: 22,
          fontWeight: 900,
          position: "absolute",
          right: 12,
          textTransform: "uppercase",
        }}
      >
        Effort
      </div>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "1fr 1fr",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {items.map((item, itemIndex) => (
          <GlowCard
            accent={accent}
            key={item}
            shine={reveal(frame, itemIndex)}
            theme={theme}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 28,
              ...enterStyle(reveal(frame, itemIndex), 24),
            }}
          >
            <HighlightTag accent={accent} index={itemIndex} theme={theme}>
              {labels[itemIndex]}
            </HighlightTag>
            <div
              style={{
                ...headingTextStyle,
                fontSize: 38,
                fontWeight: 950,
                lineHeight: 1,
              }}
            >
              {item}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
};
