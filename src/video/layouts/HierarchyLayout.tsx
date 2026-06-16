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

export const HierarchyLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);
  const top = items[0];
  const remainingItems = items.slice(1);
  const managerCount =
    remainingItems.length <= 3
      ? remainingItems.length
      : Math.min(3, Math.ceil(remainingItems.length / 2));
  const managers = remainingItems.slice(0, managerCount);
  const teams = remainingItems.slice(managerCount);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 42,
        width: "100%",
      }}
    >
      <GlowCard
        accent={accent}
        shine={reveal(frame)}
        theme={theme}
        style={{ padding: "30px 42px", textAlign: "center", width: 620 }}
      >
        <div
          style={{
            ...headingTextStyle,
            color: accent,
            fontSize: 46,
            fontWeight: 950,
            lineHeight: 1.02,
          }}
        >
          {top}
        </div>
      </GlowCard>
      <Arrow accent={accent} opacity={reveal(frame, 1)} rotate={90} />
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: `repeat(${managers.length}, 1fr)`,
          width: "100%",
        }}
      >
        {managers.map((item, itemIndex) => (
          <GlowCard
            accent={accent}
            key={item}
            shine={reveal(frame, itemIndex + 1)}
            theme={theme}
            style={{
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1.08,
              minHeight: 150,
              padding: "28px 22px",
              textAlign: "center",
              ...headingTextStyle,
              ...enterStyle(reveal(frame, itemIndex + 1), 24),
            }}
          >
            {item}
          </GlowCard>
        ))}
      </div>
      {teams.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: `repeat(${Math.min(3, teams.length)}, 1fr)`,
            width: "88%",
          }}
        >
          {teams.map((item, itemIndex) => (
            <div
              key={item}
              style={{
                background: withAlpha(accent, 0.13),
                border: `1px solid ${withAlpha(accent, 0.3)}`,
                borderRadius: 8,
                color: theme.text,
                fontSize: teams.length > 3 ? 22 : 25,
                fontWeight: 850,
                minHeight: teams.length > 3 ? 104 : 118,
                padding: "24px 16px",
                textAlign: "center",
                ...subheadingTextStyle,
                ...enterStyle(reveal(frame, itemIndex + managerCount + 1), 22),
              }}
            >
              <div
                style={{
                  background: vividGradient(theme, accent),
                  borderRadius: 999,
                  height: 7,
                  marginBottom: 18,
                }}
              />
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
