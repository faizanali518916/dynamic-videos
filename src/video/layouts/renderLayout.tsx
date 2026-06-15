import type { LayoutProps } from "../types";
import { BarGraphLayout } from "./BarGraphLayout";
import { ComparisonLayout } from "./ComparisonLayout";
import { FlowchartLayout } from "./FlowchartLayout";
import { HierarchyLayout } from "./HierarchyLayout";
import { MatrixLayout } from "./MatrixLayout";
import { ProcessLayout } from "./ProcessLayout";
import { PyramidLayout } from "./PyramidLayout";
import { QuadrantLayout } from "./QuadrantLayout";
import { RadialLayout } from "./RadialLayout";
import { RoadmapLayout } from "./RoadmapLayout";
import { StatsLayout } from "./StatsLayout";
import { TimelineLayout } from "./TimelineLayout";

export const renderLayout = (props: LayoutProps) => {
  switch (props.segment.layout) {
    case "flowchart":
      return <FlowchartLayout {...props} />;
    case "barGraph":
      return <BarGraphLayout {...props} />;
    case "timeline":
      return <TimelineLayout {...props} />;
    case "comparison":
      return <ComparisonLayout {...props} />;
    case "radial":
      return <RadialLayout {...props} />;
    case "matrix":
      return <MatrixLayout {...props} />;
    case "stats":
      return <StatsLayout {...props} />;
    case "process":
      return <ProcessLayout {...props} />;
    case "pyramid":
      return <PyramidLayout {...props} />;
    case "roadmap":
      return <RoadmapLayout {...props} />;
    case "hierarchy":
      return <HierarchyLayout {...props} />;
    case "quadrant":
      return <QuadrantLayout {...props} />;
    default:
      return <FlowchartLayout {...props} />;
  }
};
