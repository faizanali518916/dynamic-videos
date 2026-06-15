import type { CSSProperties } from "react";
import { interpolate } from "remotion";
import type { InfographicSegment, Theme } from "../layoutCatalog";
import { BRAND_FONTS } from "../brand";

const fallbackItems = [
  "Discovery",
  "Alignment",
  "Execution",
  "Measurement",
  "Iteration",
  "Scale",
  "Ownership",
];

const fallbackValues = [72, 54, 88, 61, 43, 79, 67];

export const clamp = (value: number, min = 0, max = 1): number =>
  Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string): [number, number, number] | null => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
};

export const withAlpha = (color: string, alpha: number): string => {
  const rgb = hexToRgb(color);

  if (!rgb) {
    return color;
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

export const ensureItems = (
  segment: InfographicSegment,
  desiredCount: number,
): string[] => {
  const existing = segment.items?.filter(Boolean) ?? [];
  const merged = [...existing, ...fallbackItems];

  return merged.slice(0, desiredCount);
};

export const ensureValues = (
  segment: InfographicSegment,
  desiredCount: number,
): number[] => {
  const existing = segment.values?.filter((value) => Number.isFinite(value)) ?? [];
  const merged = [...existing, ...fallbackValues];

  return merged.slice(0, desiredCount);
};

export const reveal = (frame: number, order = 0): number =>
  interpolate(frame, [6 + order * 4, 24 + order * 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const drift = (
  frame: number,
  amount: number,
  speed = 36,
  offset = 0,
): number => Math.sin((frame + offset) / speed) * amount;

export const enterStyle = (amount: number, lift = 34): CSSProperties => ({
  opacity: amount,
  transform: `translateY(${(1 - amount) * lift}px) scale(${0.96 + amount * 0.04})`,
});

export const textBlockStyle: CSSProperties = {
  letterSpacing: 0,
  overflowWrap: "anywhere",
};

export const headingTextStyle: CSSProperties = {
  ...textBlockStyle,
  fontFamily: BRAND_FONTS.heading,
};

export const subheadingTextStyle: CSSProperties = {
  ...textBlockStyle,
  fontFamily: BRAND_FONTS.subheading,
};

export const glassCard = (theme: Theme, accent: string): CSSProperties => ({
  background: `linear-gradient(135deg, ${withAlpha(theme.surface, 0.92)}, ${withAlpha(
    accent,
    0.1,
  )})`,
  border: `1px solid ${withAlpha(accent, 0.36)}`,
  borderRadius: 8,
  boxShadow: `0 28px 90px rgba(0, 0, 0, 0.28), inset 0 1px 0 ${withAlpha(
    theme.text,
    0.08,
  )}`,
});

export const vividGradient = (theme: Theme, accent: string): string =>
  `linear-gradient(135deg, ${accent || theme.primary}, ${theme.secondary})`;
