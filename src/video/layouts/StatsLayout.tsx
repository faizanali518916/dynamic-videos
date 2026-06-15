import { GlowCard } from "../primitives/GlowCard";
import { MetricBadge } from "../primitives/MetricBadge";
import type { LayoutProps } from "../types";
import { ensureItems, ensureValues, enterStyle, reveal, subheadingTextStyle, vividGradient, withAlpha } from "../utils";

export const StatsLayout = ({ accent, frame, segment, theme }: LayoutProps) => {
  const items = ensureItems(segment, 4);
  const values = ensureValues(segment, items.length);

  return (
    <div style={{ display: "grid", gap: 24, gridTemplateRows: "310px 1fr", width: "100%" }}>
      <GlowCard accent={accent} shine={reveal(frame)} theme={theme} style={{ padding: 32 }}>
        <MetricBadge accent={accent} metric={segment.metric ?? "84%"} theme={theme} />
        <div
          style={{
            background: withAlpha(accent, 0.16),
            borderRadius: 999,
            bottom: 42,
            height: 26,
            left: 360,
            overflow: "hidden",
            position: "absolute",
            right: 44,
          }}
        >
          <div
            style={{
              background: vividGradient(theme, accent),
              height: "100%",
              transform: `scaleX(${reveal(frame, 1)})`,
              transformOrigin: "left center",
              width: `${values[0]}%`,
            }}
          />
        </div>
      </GlowCard>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
        {items.map((item, itemIndex) => (
          <GlowCard
            accent={accent}
            key={item}
            shine={reveal(frame, itemIndex + 2)}
            theme={theme}
            style={{ padding: 28, ...enterStyle(reveal(frame, itemIndex + 2), 24) }}
          >
            <div style={{ color: accent, fontSize: 54, fontWeight: 950, lineHeight: 1 }}>
              {values[itemIndex]}%
            </div>
            <div
              style={{
              ...subheadingTextStyle,
                color: theme.text,
                fontSize: 29,
                fontWeight: 850,
                lineHeight: 1.08,
                marginTop: 18,
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
