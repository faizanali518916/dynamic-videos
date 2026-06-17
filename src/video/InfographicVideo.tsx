import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  OUTRO_DURATION_SECONDS,
  INTRO_HOOK_DURATION_SECONDS,
  getSegmentDurationInFrames,
  isVideoShownSegment,
  type InfographicSegment,
} from "../layoutCatalog";
import { BRAND_FONTS } from "../brand";
import { CaptionsOverlay } from "./CaptionsOverlay";
import { IntroHookOverlay } from "./IntroHookOverlay";
import { SegmentScene } from "./SegmentScene";
import type { InfographicVideoProps } from "./types";

type SegmentRange = {
  durationInFrames: number;
  from: number;
  segment: InfographicSegment;
};

type VideoOnlySceneProps = {
  startFrom: number;
  videoSrc: string;
};

const videoFillStyle = {
  height: "100%",
  objectFit: "cover" as const,
  width: "100%",
};

const getSegmentKey = (segment: InfographicSegment, index: number): string =>
  isVideoShownSegment(segment)
    ? `video-${index}`
    : `${segment.layout}-${index}`;

const getSegmentRanges = (
  segments: InfographicSegment[],
  fps: number,
): SegmentRange[] => {
  let cursor = 0;

  return segments.map((segment) => {
    const durationInFrames = getSegmentDurationInFrames(segment, fps);
    const range = {
      durationInFrames,
      from: cursor,
      segment,
    };

    cursor += durationInFrames;

    return range;
  });
};

const isVideoVisibleAtFrame = (
  ranges: SegmentRange[],
  frame: number,
): boolean =>
  ranges.some(
    ({ durationInFrames, from, segment }) =>
      isVideoShownSegment(segment) &&
      frame >= from &&
      frame < from + durationInFrames,
  );

const VideoOnlyScene = ({ startFrom, videoSrc }: VideoOnlySceneProps) => (
  <AbsoluteFill style={{ background: "#000000" }}>
    <OffthreadVideo
      src={videoSrc}
      startFrom={startFrom}
      style={videoFillStyle}
    />
  </AbsoluteFill>
);

const getOutroDurationInFrames = (fps: number): number =>
  Math.round(OUTRO_DURATION_SECONDS * fps);

export const InfographicVideo = ({
  transcriptPages = [],
  template,
  videoSrc,
}: InfographicVideoProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segmentRanges = getSegmentRanges(template.segments, fps);
  const segmentEndFrame = segmentRanges.reduce(
    (endFrame, range) =>
      Math.max(endFrame, range.from + range.durationInFrames),
    0,
  );
  const outroDurationInFrames =
    template.outro === true ? getOutroDurationInFrames(fps) : 0;
  const isVideoBased = template.videoBased === true;
  const introDurationInFrames =
    template.intro === true
      ? Math.round(INTRO_HOOK_DURATION_SECONDS * fps)
      : 0;
  const showCaptions =
    isVideoBased &&
    template.caption === true &&
    transcriptPages.length > 0 &&
    frame >= introDurationInFrames;
  const showVideoLayer =
    Boolean(videoSrc) &&
    isVideoBased &&
    isVideoVisibleAtFrame(segmentRanges, frame);

  return (
    <AbsoluteFill
      style={{
        background: template.theme.background,
        color: template.theme.text,
        fontFamily: BRAND_FONTS.subheading,
      }}
    >
      {videoSrc && isVideoBased ? (
        <AbsoluteFill
          style={{
            background: "#000000",
            opacity: showVideoLayer ? 1 : 0,
          }}
        >
          <OffthreadVideo src={videoSrc} style={videoFillStyle} />
        </AbsoluteFill>
      ) : null}

      {segmentRanges.map(({ durationInFrames, from, segment }, index) => {
        if (isVideoShownSegment(segment)) {
          if (!videoSrc || isVideoBased) {
            return null;
          }

          return (
            <Sequence
              durationInFrames={durationInFrames}
              from={from}
              key={getSegmentKey(segment, index)}
            >
              <VideoOnlyScene startFrom={from} videoSrc={videoSrc} />
            </Sequence>
          );
        }

        return (
          <Sequence
            durationInFrames={durationInFrames}
            from={from}
            key={getSegmentKey(segment, index)}
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

      {template.outro === true ? (
        <Sequence
          durationInFrames={outroDurationInFrames}
          from={segmentEndFrame}
        >
          <VideoOnlyScene startFrom={0} videoSrc={staticFile("outro.mp4")} />
        </Sequence>
      ) : null}

      {showCaptions ? (
        <CaptionsOverlay transcriptPages={transcriptPages} />
      ) : null}

      {template.intro === true ? (
        <IntroHookOverlay template={template} />
      ) : null}
    </AbsoluteFill>
  );
};
