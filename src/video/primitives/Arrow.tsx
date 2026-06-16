import type { CSSProperties } from "react";
import { withAlpha } from "../utils";

type ArrowProps = {
  accent: string;
  opacity?: number;
  rotate?: number;
  style?: CSSProperties;
};

export const Arrow = ({
  accent,
  opacity = 1,
  rotate = 0,
  style,
}: ArrowProps) => (
  <div
    style={{
      alignItems: "center",
      display: "flex",
      gap: 0,
      opacity,
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    <div
      style={{
        background: `linear-gradient(90deg, transparent, ${accent})`,
        height: 5,
        width: 92,
      }}
    />
    <div
      style={{
        borderBottom: "13px solid transparent",
        borderLeft: `22px solid ${accent}`,
        borderTop: "13px solid transparent",
        filter: `drop-shadow(0 0 18px ${withAlpha(accent, 0.55)})`,
      }}
    />
  </div>
);
