import { CurvedArrow } from "../primitives/CurvedArrow";
import { GlowCard } from "../primitives/GlowCard";
import type { LayoutProps } from "../types";
import {
  ensureItems,
  enterStyle,
  headingTextStyle,
  reveal,
  subheadingTextStyle,
} from "../utils";

export const FlowchartLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment, 5);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 42 }}>
        {items.map((item, itemIndex) => {
          const amount = reveal(frame, itemIndex);
          const isLeft = itemIndex % 2 === 0;

          return (
            <div
              key={item}
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: isLeft ? "flex-start" : "flex-end",
                position: "relative",
                paddingLeft: isLeft ? 46 : 0,
                paddingRight: isLeft ? 0 : 46,
                ...enterStyle(amount),
              }}
            >
              {itemIndex < items.length - 1 ? (
                <CurvedArrow
                  accent={accent}
                  direction={isLeft ? "right" : "left"}
                  opacity={amount * 0.88}
                  style={{
                    left: isLeft ? 680 : 110,
                    position: "absolute",
                    top: 60,
                    zIndex: 2,
                  }}
                />
              ) : null}
              <GlowCard
                accent={accent}
                shine={amount}
                theme={theme}
                style={{
                  padding: "28px 30px",
                  width: 646,
                }}
              >
                <div
                  style={{
                    ...subheadingTextStyle,
                    color: accent,
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  Step {String(itemIndex + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    ...headingTextStyle,
                    fontSize: 37,
                    fontWeight: 900,
                    lineHeight: 1.04,
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
