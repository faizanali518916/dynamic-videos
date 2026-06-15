import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "../../layoutCatalog";
import { glassCard, withAlpha } from "../utils";

type GlowCardProps = {
  accent: string;
  children: ReactNode;
  contentStyle?: CSSProperties;
  shine?: number;
  style?: CSSProperties;
  theme: Theme;
};

export const GlowCard = ({
  accent,
  children,
  contentStyle,
  shine = 0,
  style,
  theme,
}: GlowCardProps) => (
  <div
    style={{
      ...glassCard(theme, accent),
      overflow: "hidden",
      position: "relative",
      ...style,
    }}
  >
    <div
      style={{
        background: `linear-gradient(110deg, transparent, ${withAlpha(
          theme.text,
          0.18,
        )}, transparent)`,
        bottom: 0,
        left: "-70%",
        opacity: 0.45,
        position: "absolute",
        top: 0,
        transform: `translateX(${shine * 240}%) skewX(-16deg)`,
        width: "48%",
      }}
    />
    <div
      style={{
        height: "100%",
        minHeight: 0,
        position: "relative",
        width: "100%",
        zIndex: 1,
        ...contentStyle,
      }}
    >
      {children}
    </div>
  </div>
);
