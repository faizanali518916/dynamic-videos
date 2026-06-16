import { GlowCard } from "../primitives/GlowCard";
import { MetricBadge } from "../primitives/MetricBadge";
import type { LayoutProps } from "../types";
import {
  drift,
  ensureItems,
  headingTextStyle,
  reveal,
  withAlpha,
} from "../utils";

export const RadialLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);

  const radius = 326;

  // 360-degree orbit every 240 frames
  // At 30fps, this is 8 seconds.
  const orbit = (frame / 240) * Math.PI * 2;

  return (
    <div
      style={{
        height: 850,
        margin: "0 auto",
        position: "relative",
        width: 900,
      }}
    >
      <div
        style={{
          border: `2px dashed ${withAlpha(accent, 0.28)}`,
          borderRadius: "50%",
          height: 690,
          left: "50%",
          position: "absolute",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 690,
          zIndex: 0,
        }}
      />

      <MetricBadge
        accent={accent}
        label="center"
        metric={segment.metric ?? "Core"}
        theme={theme}
        style={{
          left: "50%",
          minWidth: 290,
          position: "absolute",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(${drift(frame, 2, 80)}deg)`,
          zIndex: 3,
        }}
      />

      {items.map((item, itemIndex) => {
        const baseAngle =
          (Math.PI * 2 * itemIndex) / items.length - Math.PI / 2;
        const angle = baseAngle + orbit;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const amount = reveal(frame, itemIndex);

        return (
          <GlowCard
            key={`${item}-${itemIndex}`}
            accent={accent}
            shine={amount}
            theme={theme}
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 28,
              fontWeight: 900,
              height: 136,
              justifyContent: "center",
              left: "50%",
              lineHeight: 1.05,
              padding: 18,
              position: "absolute",
              textAlign: "center",
              top: "50%",
              transform: `
                translate(-50%, -50%)
                translate(${x}px, ${y}px)
                scale(${amount})
              `,
              width: 238,
              zIndex: 2,
              ...headingTextStyle,
            }}
          >
            <div style={{ color: theme.text }}>{item}</div>
          </GlowCard>
        );
      })}
    </div>
  );
};
