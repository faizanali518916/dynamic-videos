import { GlowCard } from "../primitives/GlowCard";
import type { LayoutProps } from "../types";
import { ensureItems, ensureValues, headingTextStyle, reveal, subheadingTextStyle, vividGradient, withAlpha } from "../utils";

export const BarGraphLayout = ({ accent, frame, segment, theme }: LayoutProps) => {
  const items = ensureItems(segment, 5);
  const values = ensureValues(segment, items.length);
  const maxValue = Math.max(...values, 1);

  return (
    <GlowCard
      accent={accent}
      contentStyle={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      }}
      shine={reveal(frame)}
      theme={theme}
      style={{
        padding: "42px 36px 34px",
        width: "100%",
      }}
    >
      {items.map((item, itemIndex) => {
        const amount = reveal(frame, itemIndex);
        const height = `${Math.max(16, (values[itemIndex] / maxValue) * 100)}%`;

        return (
          <div
            key={item}
            style={{
              alignItems: "stretch",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              height: 740,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                color: theme.text,
                fontFamily: headingTextStyle.fontFamily,
                fontSize: 25,
                fontWeight: 950,
                lineHeight: 1,
                textAlign: "center",
                textShadow: `0 0 18px ${withAlpha(accent, 0.35)}`,
              }}
            >
              {values[itemIndex]}%
            </div>
            <div
              style={{
                background: withAlpha(theme.text, 0.08),
                borderRadius: 999,
                flex: 1,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  background: vividGradient(theme, accent),
                  borderRadius: 999,
                  bottom: 0,
                  boxShadow: `0 0 34px ${withAlpha(accent, 0.45)}`,
                  height,
                  left: 0,
                  position: "absolute",
                  right: 0,
                  transform: `scaleY(${amount})`,
                  transformOrigin: "bottom center",
                }}
              />
            </div>
            <div
              style={{
                ...subheadingTextStyle,
                color: theme.text,
                fontSize: 20,
                fontWeight: 850,
                minHeight: 64,
                overflowWrap: "normal",
                textAlign: "center",
                wordBreak: "normal",
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </GlowCard>
  );
};
