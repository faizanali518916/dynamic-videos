import type { CSSProperties, ReactNode } from "react";
import type { Theme } from "../../layoutCatalog";
import { subheadingTextStyle, withAlpha } from "../utils";

type HighlightTagProps = {
  accent: string;
  children: ReactNode;
  index?: number;
  style?: CSSProperties;
  theme: Theme;
};

export const HighlightTag = ({
  accent,
  children,
  index,
  style,
  theme,
}: HighlightTagProps) => (
  <div
    style={{
      ...subheadingTextStyle,
      alignItems: "center",
      background: withAlpha(accent, 0.16),
      border: `1px solid ${withAlpha(accent, 0.42)}`,
      borderRadius: 999,
      color: theme.text,
      display: "inline-flex",
      fontSize: 24,
      fontWeight: 850,
      gap: 12,
      lineHeight: 1,
      padding: "13px 18px",
      ...style,
    }}
  >
    {typeof index === "number" ? (
      <span
        style={{
          background: accent,
          borderRadius: 999,
          color: theme.background,
          display: "inline-flex",
          fontSize: 18,
          justifyContent: "center",
          minWidth: 32,
          padding: "7px 9px",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    ) : null}
    {children}
  </div>
);
