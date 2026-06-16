import type { LayoutProps } from "../types";
import {
  ensureItems,
  headingTextStyle,
  reveal,
  vividGradient,
  withAlpha,
} from "../utils";

export const PyramidLayout = ({
  accent,
  frame,
  segment,
  theme,
}: LayoutProps) => {
  const items = ensureItems(segment);

  const baseWidth = 760;
  const layerHeight = 105;
  const gap = 10;

  const totalHeight = items.length * layerHeight + (items.length - 1) * gap;

  return (
    <div
      style={{
        position: "relative",
        width: baseWidth,
        height: totalHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {items.map((item, itemIndex) => {
        const amount = reveal(frame, itemIndex);

        const yTop = itemIndex * (layerHeight + gap);
        const yBottom = yTop + layerHeight;

        const topWidth = baseWidth * (yTop / totalHeight);
        const bottomWidth = baseWidth * (yBottom / totalHeight);

        const topInsetPercent =
          bottomWidth === 0
            ? 50
            : ((bottomWidth - topWidth) / 2 / bottomWidth) * 100;

        const isTop = itemIndex === 0;

        return (
          <div
            key={`${item}-${itemIndex}`}
            style={{
              position: "absolute",
              top: yTop,
              left: "50%",
              width: bottomWidth,
              height: layerHeight,

              alignItems: "center",
              justifyContent: "center",
              display: "flex",

              background: vividGradient(theme, accent),
              border: `1px solid ${withAlpha(theme.text, 0.18)}`,
              boxShadow: `0 22px 58px ${withAlpha(accent, 0.18)}`,

              clipPath: isTop
                ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                : `polygon(${topInsetPercent}% 0%, ${
                    100 - topInsetPercent
                  }% 0%, 100% 100%, 0% 100%)`,

              color: theme.background,
              fontSize: isTop ? 26 : 32,
              fontWeight: 950,
              lineHeight: 1,
              textAlign: "center",

              opacity: amount,
              transform: `translateX(-50%) translateY(${(1 - amount) * 18}px) scale(${
                0.96 + amount * 0.04
              })`,
              transformOrigin: "center center",

              ...headingTextStyle,
            }}
          >
            <div
              style={{
                transform: isTop ? "translateY(20px)" : "none",
                padding: "0 36px",
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
};
