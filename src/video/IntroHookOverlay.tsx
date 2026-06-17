import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND_FONTS } from "../brand";
import {
  defaultTheme,
  TEXT_BOTTOM_OFFSET_PX,
  INTRO_HOOK_DURATION_SECONDS,
  type InfographicTemplate,
} from "../layoutCatalog";
import { SceneBackdrop } from "./scene/SceneBackdrop";

type IntroHookOverlayProps = {
  template: InfographicTemplate;
};

const getTypedText = (text: string, progress: number): string => {
  const trimmed = text.trim();

  if (!trimmed) {
    return "";
  }

  const visibleCharacters = Math.max(
    0,
    Math.min(trimmed.length, Math.floor(trimmed.length * progress)),
  );

  return trimmed.slice(0, visibleCharacters);
};

export const IntroHookOverlay = ({ template }: IntroHookOverlayProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = { ...defaultTheme, ...template.theme };
  const accent = theme.accent;
  const durationInFrames = Math.round(INTRO_HOOK_DURATION_SECONDS * fps);
  const typingFrames = Math.max(24, Math.round(durationInFrames * 0.65));
  const enterProgress = spring({
    fps,
    frame,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 90,
    },
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const typingProgress = interpolate(frame, [0, typingFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hookText =
    template.hookText?.trim() || "What if the whole system moved faster?";
  const typedText = getTypedText(hookText, typingProgress);
  const cursorVisible = Math.floor(frame / 6) % 2 === 0;
  const isTypingComplete = typingProgress >= 1;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        color: theme.text,
        justifyContent: "flex-end",
        opacity: fadeOut,
        overflow: "hidden",
        pointerEvents: "none",
        padding: `112px 74px ${TEXT_BOTTOM_OFFSET_PX}px`,
        zIndex: 12,
      }}
    >
      <SceneBackdrop
        accent={accent}
        frame={frame}
        progress={enterProgress}
        theme={theme}
      />
      <Img
        alt=""
        src={staticFile("logo.png")}
        style={{
          height: 54,
          objectFit: "contain",
          position: "absolute",
          right: 74,
          top: 88,
          width: "auto",
          zIndex: 2,
        }}
      />
      <div
        style={{
          background: `linear-gradient(135deg, rgba(19, 21, 50, 0.86), rgba(27, 30, 70, 0.66))`,
          border: `1px solid rgba(160, 166, 252, 0.18)`,
          borderRadius: 34,
          boxShadow: "0 36px 120px rgba(0, 0, 0, 0.34)",
          maxWidth: 980,
          maxHeight: `calc(100% - ${TEXT_BOTTOM_OFFSET_PX}px)`,
          padding: "44px 46px 48px",
          position: "relative",
          transform: `translateY(${(1 - enterProgress) * 26}px) scale(${
            0.96 + enterProgress * 0.04
          })`,
          width: "100%",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontFamily: BRAND_FONTS.heading,
            fontSize: 94,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.95,
            margin: 0,
            overflowWrap: "anywhere",
            textShadow: "0 26px 80px rgba(0, 0, 0, 0.32)",
            whiteSpace: "pre-wrap",
          }}
        >
          {typedText}
          {(cursorVisible || !isTypingComplete) && (
            <span style={{ color: accent }}>{"|"}</span>
          )}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
