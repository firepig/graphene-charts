import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";
import { sankey, sankeyCenter, sankeyLinkHorizontal } from "@visx/sankey";
import type { Transition } from "motion/react";
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type Margin,
  type SankeyLinkDatum,
  type SankeyNodeDatum,
  SankeyProvider,
  type SankeyTooltipData,
} from "./sankey-context";

export interface SankeyData {
  nodes: SankeyNodeDatum[];
  links: SankeyLinkDatum[];
}

export interface SankeyChartProps {
  /** Sankey data with nodes and links arrays */
  data: SankeyData;
  /** Chart margins. Default: { top: 40, right: 180, bottom: 40, left: 180 } */
  margin?: Partial<Margin>;
  /** Animation duration in ms. Default: 1100 */
  animationDuration?: number;
  /** Framer Motion enter transition (spring or tween) */
  enterTransition?: Transition;
  /** Changing this re-triggers the enter animation */
  revealSignature?: string;
  /** CSS aspect-ratio value. Default: "2 / 1" */
  aspectRatio?: string;
  /** Node bar width in px. Default: 16 */
  nodeWidth?: number;
  /** Vertical gap between nodes in px. Default: 24 */
  nodePadding?: number;
  /** Extra class name on the container div */
  className?: string;
  /** Inline styles on the container div */
  style?: React.CSSProperties;
  /** Child components: SankeyNode, SankeyLink, SankeyTooltip */
  children: ReactNode;
  /** Controlled hovered node index (e.g. driven by an external legend) */
  hoveredNodeIndex?: number | null;
  /** Fires when the user hovers a node on the chart surface */
  onNodeHoverChange?: (index: number | null) => void;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 180, bottom: 40, left: 180 };

interface SankeyChartInnerProps {
  data: SankeyData;
  width: number;
  height: number;
  margin: Margin;
  animationDuration: number;
  enterTransition?: Transition;
  revealSignature?: string;
  nodeWidth: number;
  nodePadding: number;
  children: ReactNode;
  hoveredNodeIndexProp?: number | null;
  onNodeHoverChange?: (index: number | null) => void;
}

function SankeyChartInner(props: SankeyChartInnerProps) {
  if (props.width < 10 || props.height < 10) return null;
  return <SankeyChartCore {...props} />;
}

const SankeyChartCore = memo(function SankeyChartCore({
  data,
  width,
  height,
  margin,
  animationDuration,
  enterTransition,
  revealSignature = "",
  nodeWidth,
  nodePadding,
  children,
  hoveredNodeIndexProp,
  onNodeHoverChange,
}: SankeyChartInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealEpoch, setRevealEpoch] = useState(0);
  const [internalHoveredNodeIndex, setInternalHoveredNodeIndex] = useState<number | null>(null);

  const isNodeHoverControlled = hoveredNodeIndexProp !== undefined;
  const hoveredNodeIndex = isNodeHoverControlled
    ? hoveredNodeIndexProp
    : internalHoveredNodeIndex;

  const setHoveredNodeIndex = useCallback(
    (index: number | null) => {
      if (isNodeHoverControlled) {
        onNodeHoverChange?.(index);
      } else {
        setInternalHoveredNodeIndex(index);
      }
    },
    [isNodeHoverControlled, onNodeHoverChange]
  );

  const [hoveredLinkIndex, setHoveredLinkIndex] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<SankeyTooltipData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setRevealEpoch((n) => n + 1);
    setIsLoaded(false);
    const timeout = setTimeout(() => setIsLoaded(true), animationDuration);
    return () => clearTimeout(timeout);
  }, [animationDuration, revealSignature]);

  const sankeyGenerator = useMemo(
    () =>
      sankey<SankeyNodeDatum, SankeyLinkDatum>()
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .nodeAlign(sankeyCenter)
        .extent([
          [0, 0],
          [innerWidth, innerHeight],
        ]),
    [innerWidth, innerHeight, nodeWidth, nodePadding]
  );

  const graph = useMemo(() => {
    const clonedData = {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };
    return sankeyGenerator(clonedData);
  }, [data, sankeyGenerator]);

  const createPath = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any) => {
      try {
        return sankeyLinkHorizontal()(link) ?? "";
      } catch {
        return "";
      }
    },
    []
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const point = localPoint(event);
    if (point) setMousePos({ x: point.x, y: point.y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNodeIndex(null);
    setHoveredLinkIndex(null);
    setTooltipData(null);
    setMousePos(null);
  }, [setHoveredNodeIndex]);

  const contextValue = {
    graph,
    nodes: graph.nodes,
    links: graph.links,
    width,
    height,
    innerWidth,
    innerHeight,
    margin,
    hoveredNodeIndex,
    hoveredLinkIndex,
    setHoveredNodeIndex,
    setHoveredLinkIndex,
    tooltipData,
    setTooltipData,
    containerRef,
    isLoaded,
    animationDuration,
    enterTransition,
    revealEpoch,
    mousePos,
    createPath,
  };

  return (
    <SankeyProvider value={contextValue}>
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg
          aria-hidden="true"
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <g transform={`translate(${margin.left},${margin.top})`}>
            {children}
          </g>
        </svg>
      </div>
    </SankeyProvider>
  );
});

export function SankeyChart({
  data,
  margin: marginProp,
  animationDuration = 1100,
  enterTransition,
  revealSignature,
  aspectRatio = "2 / 1",
  nodeWidth = 16,
  nodePadding = 24,
  className = "",
  style,
  children,
  hoveredNodeIndex,
  onNodeHoverChange,
}: SankeyChartProps) {
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio, ...style }}
    >
      <ParentSize>
        {({ width, height }) => (
          <SankeyChartInner
            animationDuration={animationDuration}
            data={data}
            enterTransition={enterTransition}
            height={height}
            hoveredNodeIndexProp={hoveredNodeIndex}
            margin={margin}
            nodePadding={nodePadding}
            nodeWidth={nodeWidth}
            onNodeHoverChange={onNodeHoverChange}
            revealSignature={revealSignature}
            width={width}
          >
            {children}
          </SankeyChartInner>
        )}
      </ParentSize>
    </div>
  );
}

SankeyChart.displayName = "SankeyChart";
export default SankeyChart;
