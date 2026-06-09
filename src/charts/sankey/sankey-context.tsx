import type { SankeyGraph, SankeyLink, SankeyNode } from "d3-sankey";
import type { Transition } from "motion/react";
import {
  createContext,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useContext,
} from "react";

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SankeyNodeDatum {
  name: string;
  category?: "source" | "landing" | "outcome";
  [key: string]: unknown;
}

export interface SankeyLinkDatum {
  source: number;
  target: number;
  value: number;
  [key: string]: unknown;
}

export interface SankeyTooltipData {
  type: "node" | "link";
  nodeIndex?: number;
  linkIndex?: number;
  x: number;
  y: number;
  data: SankeyNodeDatum | SankeyLinkDatum;
}

export interface SankeyContextValue {
  graph: SankeyGraph<SankeyNodeDatum, SankeyLinkDatum>;
  nodes: SankeyNode<SankeyNodeDatum, SankeyLinkDatum>[];
  links: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>[];
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;
  hoveredNodeIndex: number | null;
  hoveredLinkIndex: number | null;
  setHoveredNodeIndex: (index: number | null) => void;
  setHoveredLinkIndex: (index: number | null) => void;
  tooltipData: SankeyTooltipData | null;
  setTooltipData: Dispatch<SetStateAction<SankeyTooltipData | null>>;
  containerRef: RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  animationDuration: number;
  enterTransition?: Transition;
  revealEpoch: number;
  mousePos: { x: number; y: number } | null;
  createPath: (link: SankeyLink<SankeyNodeDatum, SankeyLinkDatum>) => string;
}

const SankeyContext = createContext<SankeyContextValue | null>(null);

export function SankeyProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SankeyContextValue;
}) {
  return (
    <SankeyContext.Provider value={value}>{children}</SankeyContext.Provider>
  );
}

export function useSankey(): SankeyContextValue {
  const context = useContext(SankeyContext);
  if (!context) {
    throw new Error("useSankey must be used within a SankeyProvider");
  }
  return context;
}

/**
 * CSS variable names for theming Sankey charts.
 * Override these on a parent element to customize colors.
 *
 * @example
 * ```css
 * .my-chart {
 *   --chart-1: #8b5cf6;
 *   --chart-2: #06b6d4;
 *   --chart-3: #10b981;
 *   --chart-foreground: #f1f5f9;
 *   --chart-tooltip-background: rgba(15,23,42,0.92);
 * }
 * ```
 */
export const sankeyCssVars = {
  chart1: "var(--chart-1, #8b5cf6)",
  chart2: "var(--chart-2, #06b6d4)",
  chart3: "var(--chart-3, #10b981)",
  chart4: "var(--chart-4, #f59e0b)",
  chart5: "var(--chart-5, #ef4444)",
  foreground: "var(--chart-foreground, #f1f5f9)",
  tooltipBackground: "var(--chart-tooltip-background, rgba(15,23,42,0.92))",
  tooltipForeground: "var(--chart-tooltip-foreground, #f1f5f9)",
};
