import type { CSSProperties } from "react";
import type { Theme } from "../../layoutCatalog";
import { headingTextStyle, subheadingTextStyle, vividGradient, withAlpha } from "../utils";

type MetricBadgeProps = {
  accent: string;
  label?: string;
  metric: string;
  style?: CSSProperties;
  theme: Theme;
};

export const MetricBadge = ({
  accent,
  label = "signal",
  metric,
  style,
  theme,
}: MetricBadgeProps) => (
  <div
    style={{
      background: vividGradient(theme, accent),
      borderRadius: 8,
      boxShadow: `0 20px 70px ${withAlpha(accent, 0.3)}`,
      color: theme.background,
      padding: "24px 26px",
      ...style,
    }}
  >
    <div
      style={{
        fontSize: 20,
        fontFamily: subheadingTextStyle.fontFamily,
        fontWeight: 900,
        opacity: 0.78,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
    <div
      style={{
        ...headingTextStyle,
        fontSize: 58,
        fontWeight: 950,
        lineHeight: 0.95,
        marginTop: 8,
      }}
    >
      {metric}
    </div>
  </div>
);
