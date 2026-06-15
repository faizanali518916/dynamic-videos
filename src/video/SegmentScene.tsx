import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LAYOUT_SPECS, defaultTheme } from "../layoutCatalog";
import { SceneBackdrop } from "./scene/SceneBackdrop";
import { SceneFooter } from "./scene/SceneFooter";
import { SceneHeader } from "./scene/SceneHeader";
import { renderLayout } from "./layouts/renderLayout";
import type { SegmentSceneProps } from "./types";
import { enterStyle, headingTextStyle, reveal, subheadingTextStyle } from "./utils";

export const SegmentScene = ({
  durationInFrames,
  index,
  segment,
  template,
  total,
}: SegmentSceneProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = { ...defaultTheme, ...template.theme };
  const accent = segment.accent ?? theme.accent;
  const intro = spring({
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

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.text,
        opacity: outro,
        overflow: "hidden",
        padding: "82px 74px 70px",
      }}
    >
      <SceneBackdrop accent={accent} frame={frame} progress={intro} theme={theme} />
      <SceneHeader
        accent={accent}
        index={index}
        segment={segment}
        template={template}
        theme={theme}
        total={total}
      />
      <section
        style={{
          marginTop: 44,
          position: "relative",
          zIndex: 2,
          ...enterStyle(reveal(frame), 18),
        }}
      >
        <div
          style={{
            color: accent,
            fontSize: 25,
            fontFamily: subheadingTextStyle.fontFamily,
            fontWeight: 900,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          {LAYOUT_SPECS[segment.layout].label}
        </div>
        <h1
          style={{
            ...headingTextStyle,
            fontSize: 78,
            fontWeight: 950,
            lineHeight: 0.95,
            margin: "18px 0 0",
            maxWidth: 920,
          }}
        >
          {segment.title}
        </h1>
        {segment.subtitle ? (
          <p
            style={{
              ...subheadingTextStyle,
              color: theme.muted,
              fontSize: 31,
              lineHeight: 1.28,
              margin: "26px 0 0",
              maxWidth: 850,
            }}
          >
            {segment.subtitle}
          </p>
        ) : null}
      </section>

      <main
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
          justifyContent: "center",
          marginTop: 48,
          minHeight: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        {renderLayout({
          accent,
          durationInFrames,
          frame,
          index,
          progress: intro,
          segment,
          theme,
        })}
      </main>

      <SceneFooter />
    </AbsoluteFill>
  );
};
