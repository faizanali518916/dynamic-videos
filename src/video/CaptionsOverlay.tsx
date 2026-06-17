import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_COLORS, BRAND_FONTS } from "../brand";
import { TEXT_BOTTOM_OFFSET_PX } from "../layoutCatalog";
import type { TranscriptPage } from "./types";

type CaptionsOverlayProps = {
  transcriptPages: TranscriptPage[];
};

export const CaptionsOverlay = ({ transcriptPages }: CaptionsOverlayProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;
  const page = transcriptPages.find(
    ({ endMs, startMs }) => currentMs >= startMs && currentMs < endMs,
  );

  if (!page) {
    return null;
  }

  const entrance = interpolate(
    currentMs,
    [page.startMs, page.startMs + 120],
    [0.92, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        alignItems: "center",
        bottom: TEXT_BOTTOM_OFFSET_PX,
        display: "flex",
        justifyContent: "center",
        left: 62,
        pointerEvents: "none",
        position: "absolute",
        right: 62,
        transform: `scale(${entrance})`,
        zIndex: 20,
      }}
    >
      <div
        style={{
          color: BRAND_COLORS.text,
          fontFamily: BRAND_FONTS.subheading,
          fontSize: 62,
          fontWeight: 950,
          letterSpacing: 0,
          lineHeight: 1.08,
          maxWidth: 940,
          textAlign: "center",
          textShadow:
            "0 5px 0 rgba(0, 0, 0, 0.64), 0 12px 28px rgba(0, 0, 0, 0.42)",
          textTransform: "uppercase",
        }}
      >
        {page.tokens.map((token, index) => {
          const isActive = currentMs >= token.fromMs && currentMs <= token.toMs;
          const text = token.text;

          if (!text) {
            return null;
          }

          return (
            <span
              key={`${token.fromMs}-${token.toMs}-${index}`}
              style={{
                color: isActive ? BRAND_COLORS.secondary : BRAND_COLORS.text,
                display: "inline-block",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                whiteSpace: "pre-wrap",
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
