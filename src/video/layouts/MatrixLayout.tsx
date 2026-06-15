import { GlowCard } from "../primitives/GlowCard";
import { HighlightTag } from "../primitives/HighlightTag";
import type { LayoutProps } from "../types";
import { ensureItems, enterStyle, headingTextStyle, reveal, vividGradient, withAlpha } from "../utils";

export const MatrixLayout = ({ accent, frame, segment, theme }: LayoutProps) => {
  const items = ensureItems(segment, 4);
  const labels = ["Pop", "Push", "Build", "Hold"];

  return (
    <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr", width: "100%" }}>
      {items.map((item, itemIndex) => (
        <GlowCard
          accent={accent}
          key={item}
          shine={reveal(frame, itemIndex)}
          theme={theme}
          style={{
            minHeight: 382,
            padding: 32,
            ...enterStyle(reveal(frame, itemIndex)),
          }}
        >
          <HighlightTag accent={accent} index={itemIndex} theme={theme}>
            {labels[itemIndex]}
          </HighlightTag>
          <div
            style={{
              background: vividGradient(theme, accent),
              borderRadius: 999,
              bottom: 30,
              height: 8,
              left: 32,
              position: "absolute",
              right: 32,
              transform: `scaleX(${reveal(frame, itemIndex + 1)})`,
              transformOrigin: "left center",
            }}
          />
          <div
            style={{
              ...headingTextStyle,
              bottom: 58,
              color: theme.text,
              fontSize: 43,
              fontWeight: 950,
              left: 32,
              lineHeight: 0.98,
              position: "absolute",
              right: 32,
              textShadow: `0 0 24px ${withAlpha(accent, 0.18)}`,
            }}
          >
            {item}
          </div>
        </GlowCard>
      ))}
    </div>
  );
};
