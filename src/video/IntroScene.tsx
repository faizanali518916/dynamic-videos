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
import { defaultTheme, type InfographicTemplate } from "../layoutCatalog";
import { SceneBackdrop } from "./scene/SceneBackdrop";

type IntroSceneProps = {
  durationInFrames: number;
  template: InfographicTemplate;
};

export const IntroScene = ({ durationInFrames, template }: IntroSceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = { ...defaultTheme, ...template.theme };
  const accent = theme.accent;
  const progress = spring({
    fps,
    frame,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 90,
    },
  });
  const outro = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const hookText =
    template.hookText?.trim() || "What if the whole system moved faster?";

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: theme.background,
        color: theme.text,
        justifyContent: "center",
        opacity: outro,
        overflow: "hidden",
        padding: "120px 74px",
      }}
    >
      <SceneBackdrop
        accent={accent}
        frame={frame}
        progress={progress}
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
          maxWidth: 910,
          position: "relative",
          transform: `translateY(${(1 - progress) * 24}px)`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: BRAND_FONTS.subheading,
            fontSize: 28,
            fontWeight: 950,
            letterSpacing: 0,
            marginBottom: 28,
            textTransform: "uppercase",
          }}
        >
          The hook
        </div>
        <h1
          style={{
            fontFamily: BRAND_FONTS.heading,
            fontSize: 96,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.95,
            margin: 0,
            overflowWrap: "anywhere",
            textShadow: "0 26px 80px rgba(0, 0, 0, 0.32)",
          }}
        >
          {hookText}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
