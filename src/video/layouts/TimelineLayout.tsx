import { Arrow } from "../primitives/Arrow";
import { GlowCard } from "../primitives/GlowCard";
import type { LayoutProps } from "../types";
import { ensureItems, enterStyle, headingTextStyle, reveal, subheadingTextStyle, vividGradient, withAlpha } from "../utils";

export const TimelineLayout = ({ accent, frame, segment, theme }: LayoutProps) => {
  const items = ensureItems(segment, 5);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          background: vividGradient(theme, accent),
          bottom: 52,
          filter: `drop-shadow(0 0 22px ${withAlpha(accent, 0.5)})`,
          left: 100,
          position: "absolute",
          top: 48,
          width: 6,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 27 }}>
        {items.map((item, itemIndex) => {
          const amount = reveal(frame, itemIndex);

          return (
            <div
              key={item}
              style={{
                alignItems: "center",
                display: "grid",
                gap: 26,
                gridTemplateColumns: "190px 1fr",
                ...enterStyle(amount),
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: vividGradient(theme, accent),
                  borderRadius: "50%",
                  color: theme.background,
                  display: "flex",
                  fontSize: 29,
                  fontWeight: 950,
                  height: 104,
                  justifyContent: "center",
                  marginLeft: 50,
                  position: "relative",
                  width: 104,
                  zIndex: 1,
                }}
              >
                {String(itemIndex + 1).padStart(2, "0")}
              </div>
              <GlowCard accent={accent} shine={amount} theme={theme} style={{ padding: 28 }}>
                <Arrow
                  accent={accent}
                  opacity={amount * 0.7}
                  style={{ position: "absolute", right: 24, top: 26 }}
                />
                <div
                  style={{
                    ...headingTextStyle,
                    fontSize: 37,
                    fontWeight: 900,
                    lineHeight: 1.06,
                    maxWidth: 610,
                  }}
                >
                  {item}
                </div>
                <div style={{ color: theme.muted, fontSize: 22, marginTop: 10 }}>
                  <span style={{ fontFamily: subheadingTextStyle.fontFamily }}>
                    Milestone {itemIndex + 1}
                  </span>
                </div>
              </GlowCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
