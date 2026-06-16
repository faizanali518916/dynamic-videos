import { Arrow } from "../primitives/Arrow";
import { GlowCard } from "../primitives/GlowCard";
import { HighlightTag } from "../primitives/HighlightTag";
import type { LayoutProps } from "../types";
import {
  ensureItems,
  enterStyle,
  headingTextStyle,
  reveal,
  withAlpha,
} from "../utils";

export const ComparisonLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);
  const midpoint = Math.ceil(items.length / 2);
  const columns = [
    { color: theme.secondary, label: "Before", rows: items.slice(0, midpoint) },
    { color: accent, label: "After", rows: items.slice(midpoint) },
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: 30,
        gridTemplateColumns: "1fr 1fr",
        width: "100%",
      }}
    >
      {columns.map((column, columnIndex) => (
        <GlowCard
          accent={column.color}
          key={column.label}
          shine={reveal(frame, columnIndex)}
          theme={theme}
          style={{
            padding: "32px 28px",
            transform: `rotate(${columnIndex === 0 ? -1 : 1}deg)`,
          }}
        >
          <HighlightTag accent={column.color} theme={theme}>
            {column.label}
          </HighlightTag>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginTop: 30,
            }}
          >
            {column.rows.map((item, itemIndex) => (
              <div
                key={item}
                style={{
                  background: withAlpha(column.color, 0.12),
                  border: `1px solid ${withAlpha(column.color, 0.25)}`,
                  borderRadius: 8,
                  color: theme.text,
                  fontSize: 32,
                  fontWeight: 850,
                  lineHeight: 1.08,
                  minHeight: 114,
                  padding: "23px",
                  position: "relative",
                  ...headingTextStyle,
                  ...enterStyle(reveal(frame, itemIndex + 2), 22),
                }}
              >
                {columnIndex === 1 ? (
                  <Arrow
                    accent={column.color}
                    opacity={0.7}
                    style={{
                      position: "absolute",
                      right: 18,
                      top: 18,
                      transform: "scale(0.55)",
                    }}
                  />
                ) : null}
                {item}
              </div>
            ))}
          </div>
        </GlowCard>
      ))}
    </div>
  );
};
