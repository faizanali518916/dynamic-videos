import type { Theme } from "../../layoutCatalog";
import { drift, vividGradient, withAlpha } from "../utils";

type SceneBackdropProps = {
  accent: string;
  frame: number;
  progress: number;
  theme: Theme;
};

export const SceneBackdrop = ({
  accent,
  frame,
  progress,
  theme,
}: SceneBackdropProps) => (
  <>
    <div
      style={{
        background: `radial-gradient(circle at 14% 8%, ${withAlpha(
          theme.primary,
          0.24,
        )}, transparent 28%), radial-gradient(circle at 86% 16%, ${withAlpha(
          theme.secondary,
          0.16,
        )}, transparent 30%), radial-gradient(circle at 48% 86%, ${withAlpha(
          theme.primary,
          0.14,
        )}, transparent 38%)`,
        inset: 0,
        opacity: 0.82,
        position: "absolute",
      }}
    />
    <div
      style={{
        backgroundImage: `linear-gradient(${withAlpha(
          theme.text,
          0.055,
        )} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(
          theme.text,
          0.055,
        )} 1px, transparent 1px)`,
        backgroundPosition: `${drift(frame, 18)}px ${drift(frame, 18, 42, 8)}px`,
        backgroundSize: "72px 72px",
        inset: 0,
        opacity: 0.28 + progress * 0.14,
        position: "absolute",
      }}
    />
    <div
      style={{
        background: vividGradient(theme, accent),
        filter: "blur(10px)",
        height: 7,
        left: 74,
        opacity: 0.76,
        position: "absolute",
        right: 74,
        top: 42,
        transform: `scaleX(${0.15 + progress * 0.85})`,
        transformOrigin: "left center",
      }}
    />
    <div
      style={{
        border: `1px solid ${withAlpha(theme.secondary, 0.16)}`,
        borderRadius: "50%",
        height: 520,
        opacity: 0.55,
        position: "absolute",
        right: -170 + drift(frame, 16, 58),
        top: 320 + drift(frame, 12, 44, 20),
        width: 520,
      }}
    />
  </>
);
