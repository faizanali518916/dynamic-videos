import { Arrow } from "../primitives/Arrow";
import { GlowCard } from "../primitives/GlowCard";
import type { LayoutProps } from "../types";
import {
  ensureItems,
  enterStyle,
  headingTextStyle,
  reveal,
  subheadingTextStyle,
  vividGradient,
  withAlpha,
} from "../utils";

export const RoadmapLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          background: vividGradient(theme, accent),
          borderRadius: 999,
          filter: `drop-shadow(0 0 22px ${withAlpha(accent, 0.45)})`,
          height: 125 * items.length,
          left: "50%",
          opacity: 0.72,
          position: "absolute",
          top: 65,
          transform: "translateX(-50%)",
          width: 8,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
        {items.map((item, itemIndex) => {
          const isLeft = itemIndex % 2 === 0;
          const amount = reveal(frame, itemIndex);

          return (
            <div
              key={item}
              style={{
                display: "flex",
                justifyContent: isLeft ? "flex-start" : "flex-end",
                minHeight: 130,
                position: "relative",
                ...enterStyle(amount, 30),
              }}
            >
              <Arrow
                accent={accent}
                opacity={amount * 0.8}
                rotate={isLeft ? 180 : 0}
                style={{
                  left: isLeft ? 420 : 400,
                  position: "absolute",
                  top: 52,
                }}
              />
              <GlowCard
                accent={accent}
                shine={amount}
                theme={theme}
                style={{ padding: 25, width: 410 }}
              >
                <div
                  style={{
                    ...subheadingTextStyle,
                    color: accent,
                    fontSize: 21,
                    fontWeight: 950,
                    textTransform: "uppercase",
                  }}
                >
                  Stop {itemIndex + 1}
                </div>
                <div
                  style={{
                    ...headingTextStyle,
                    fontSize: 35,
                    fontWeight: 930,
                    lineHeight: 1.02,
                    marginTop: 10,
                  }}
                >
                  {item}
                </div>
              </GlowCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
