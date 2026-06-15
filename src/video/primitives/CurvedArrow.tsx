import type { CSSProperties } from "react";
import { withAlpha } from "../utils";

type CurvedArrowProps = {
  accent: string;
  direction?: "right" | "left";
  opacity?: number;
  style?: CSSProperties;
};

export const CurvedArrow = ({
  accent,
  direction = "right",
  opacity = 1,
  style,
}: CurvedArrowProps) => (
  <svg
    height="112"
    viewBox="0 0 150 112"
    width="150"
    style={{
      filter: `drop-shadow(0 0 14px ${withAlpha(accent, 0.36)})`,
      opacity,
      overflow: "visible",
      transform: direction === "left" ? "scaleX(-1)" : undefined,
      ...style,
    }}
  >
    <path
      d="M12 12 H86 Q126 12 126 52 V82"
      fill="none"
      stroke={accent}
      strokeLinecap="round"
      strokeWidth="5"
    />
    <path d="M112 82 L126 108 L140 82 Z" fill={accent} />
  </svg>
);
