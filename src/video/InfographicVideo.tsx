import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { getSegmentDurationInFrames } from "../layoutCatalog";
import { BRAND_FONTS } from "../brand";
import { SegmentScene } from "./SegmentScene";
import type { InfographicVideoProps } from "./types";

export const InfographicVideo = ({ template }: InfographicVideoProps) => {
  const { fps } = useVideoConfig();
  let cursor = 0;

  return (
    <AbsoluteFill
      style={{
        background: template.theme.background,
        color: template.theme.text,
        fontFamily: BRAND_FONTS.subheading,
      }}
    >
      {template.segments.map((segment, index) => {
        const durationInFrames = getSegmentDurationInFrames(segment.layout, fps);
        const from = cursor;
        cursor += durationInFrames;

        return (
          <Sequence
            durationInFrames={durationInFrames}
            from={from}
            key={`${segment.layout}-${index}`}
          >
            <SegmentScene
              durationInFrames={durationInFrames}
              index={index}
              segment={segment}
              template={template}
              total={template.segments.length}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
