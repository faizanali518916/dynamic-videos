import { Arrow } from "../primitives/Arrow";
import { GlowCard } from "../primitives/GlowCard";
import type { LayoutProps } from "../types";
import {
  ensureItems,
  enterStyle,
  headingTextStyle,
  reveal,
  vividGradient,
} from "../utils";

export const ProcessLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
      }}
    >
      {items.map((item, itemIndex) => (
        <GlowCard
          accent={accent}
          contentStyle={{
            display: "grid",
            gap: 26,
            gridTemplateColumns: "106px 1fr 128px",
          }}
          key={item}
          shine={reveal(frame, itemIndex)}
          theme={theme}
          style={{
            minHeight: 126,
            padding: "20px 26px",
            ...enterStyle(reveal(frame, itemIndex), 26),
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: vividGradient(theme, accent),
              borderRadius: 8,
              color: theme.background,
              display: "flex",
              fontSize: 34,
              fontWeight: 950,
              height: 86,
              justifyContent: "center",
              width: 86,
            }}
          >
            {itemIndex + 1}
          </div>
          <div
            style={{
              ...headingTextStyle,
              alignSelf: "center",
              fontSize: 38,
              fontWeight: 900,
              lineHeight: 1.05,
            }}
          >
            {item}
          </div>
          <Arrow
            accent={accent}
            opacity={reveal(frame, itemIndex + 1)}
            style={{ alignSelf: "center" }}
          />
        </GlowCard>
      ))}
    </div>
  );
};
