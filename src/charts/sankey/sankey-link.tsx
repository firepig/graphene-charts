import type {
  SankeyLink as SankeyLinkType,
  SankeyNode as SankeyNodeType,
} from "d3-sankey";
import { motion, useTransform } from "motion/react";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMountProgress } from "../use-mount-progress";
import {
  type SankeyLinkDatum,
  type SankeyNodeDatum,
  useSankey,
} from "./sankey-context";

type NodeOrIndex = SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum> | number;

function getNodeIndex(nodeOrIndex: NodeOrIndex): number | undefined {
  if (typeof nodeOrIndex === "number") return nodeOrIndex;
  return nodeOrIndex.index;
}

function getNodeObject(
  nodeOrIndex: NodeOrIndex
): SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum> | null {
  if (typeof nodeOrIndex === "number") return null;
  return nodeOrIndex;
}

const DEFAULT_COLORS = [
  "var(--chart-1, #8b5cf6)",
  "var(--chart-2, #06b6d4)",
  "var(--chart-3, #10b981)",
  "var(--chart-4, #f59e0b)",
  "var(--chart-5, #ef4444)",
];

function getDefaultNodeColor(
  node: SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum>
): string {
  const index = node.index ?? 0;
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? DEFAULT_COLORS[0];
}

export interface SankeyLinkProps {
  /** Solid stroke color (overrides gradient) */
  stroke?: string;
  /** Stroke opacity. Default: 0.5 */
  strokeOpacity?: number;
  /** Opacity when another element is hovered. Default: 0.1 */
  fadedOpacity?: number;
  /** Use a gradient from source color → target color. Default: true */
  useGradient?: boolean;
  /** Custom per-node color function (used for gradient endpoints) */
  getNodeColor?: (
    node: SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum>,
    index: number
  ) => string;
  /** Custom per-link color function (overrides gradient) */
  getLinkColor?: (
    link: SankeyLinkType<SankeyNodeDatum, SankeyLinkDatum>,
    index: number
  ) => string;
  /** SVG `<pattern>` elements to render in `<defs>` */
  patterns?: React.ReactNode;
  /** Return a pattern ID for a link, or null to use gradient/solid */
  getLinkPattern?: (
    link: SankeyLinkType<SankeyNodeDatum, SankeyLinkDatum>,
    index: number
  ) => string | null | undefined;
}

interface AnimatedLinkProps {
  path: string;
  width: number;
  stroke: string;
  strokeOpacity: number;
  index: number;
  totalLinks: number;
  isFaded: boolean;
  isHighlighted: boolean;
  fadedOpacity: number;
  animationDuration: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function AnimatedLink({
  path,
  width,
  stroke,
  strokeOpacity,
  index,
  totalLinks,
  isFaded,
  isHighlighted,
  fadedOpacity,
  animationDuration,
  onMouseEnter,
  onMouseLeave,
}: AnimatedLinkProps) {
  const { enterTransition, revealEpoch } = useSankey();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const linkStartDelay = animationDuration * 0.2;
  const linkAnimDuration = animationDuration * 0.8;
  const staggerDelaySeconds =
    (linkStartDelay + (index / totalLinks) * linkAnimDuration * 0.4) / 1000;

  useLayoutEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  });

  const progress = useMountProgress(
    enterTransition,
    staggerDelaySeconds,
    `${revealEpoch}-${index}`
  );
  const strokeDashoffset = useTransform(progress, [0, 1], [pathLength, 0]);

  const targetOpacity = isFaded
    ? fadedOpacity
    : isHighlighted
    ? Math.min(1, strokeOpacity * 1.3)
    : strokeOpacity;

  const dashArray = pathLength > 0 ? `${pathLength} ${pathLength}` : "none";

  return (
    <motion.path
      animate={{ opacity: targetOpacity }}
      d={path}
      fill="none"
      initial={{ opacity: strokeOpacity }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={pathRef as any}
      stroke={stroke}
      strokeDasharray={dashArray}
      strokeWidth={Math.max(1, width)}
      style={{ cursor: "pointer", strokeDashoffset }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    />
  );
}

export function SankeyLink({
  stroke,
  strokeOpacity = 0.5,
  fadedOpacity = 0.1,
  useGradient = true,
  getNodeColor,
  getLinkColor,
  patterns,
  getLinkPattern,
}: SankeyLinkProps) {
  const {
    links,
    hoveredNodeIndex,
    hoveredLinkIndex,
    setHoveredLinkIndex,
    setTooltipData,
    animationDuration,
    createPath,
  } = useSankey();

  const getNodeColorFn = useCallback(
    (node: SankeyNodeType<SankeyNodeDatum, SankeyLinkDatum>): string => {
      if (getNodeColor) return getNodeColor(node, node.index ?? 0);
      return getDefaultNodeColor(node);
    },
    [getNodeColor]
  );

  const getLinkColorFn = useCallback(
    (link: SankeyLinkType<SankeyNodeDatum, SankeyLinkDatum>, index: number) => {
      if (getLinkColor) return getLinkColor(link, index);
      return stroke ?? "var(--chart-1, #8b5cf6)";
    },
    [getLinkColor, stroke]
  );

  const isAnyHovered = hoveredNodeIndex !== null || hoveredLinkIndex !== null;

  const gradientDefs = useMemo(() => {
    if (!useGradient || stroke || getLinkColor) return null;

    return links.map((link, index) => {
      const sourceNode = getNodeObject(link.source as NodeOrIndex);
      const targetNode = getNodeObject(link.target as NodeOrIndex);
      const sourceColor = sourceNode
        ? getNodeColorFn(sourceNode)
        : "var(--chart-1, #8b5cf6)";
      const targetColor = targetNode
        ? getNodeColorFn(targetNode)
        : "var(--chart-1, #8b5cf6)";
      const gradientId = `link-gradient-${index}`;
      const x1 = sourceNode?.x1 ?? 0;
      const x2 = targetNode?.x0 ?? 100;

      return (
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={gradientId}
          key={gradientId}
          x1={x1}
          x2={x2}
          y1="0"
          y2="0"
        >
          <stop offset="0%" stopColor={sourceColor} stopOpacity={1} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={1} />
        </linearGradient>
      );
    });
  }, [links, useGradient, stroke, getLinkColor, getNodeColorFn]);

  return (
    <g className="sankey-links">
      <defs>
        {patterns}
        {gradientDefs}
      </defs>
      {links.map((link, index) => {
        const path = createPath(link);
        const linkWidth = link.width ?? 1;

        if (!path || path.trim() === "") return null;

        const sIdx = getNodeIndex(link.source as NodeOrIndex);
        const tIdx = getNodeIndex(link.target as NodeOrIndex);
        const sourceIdx = sIdx ?? (typeof link.source === "number" ? link.source : -1);
        const targetIdx = tIdx ?? (typeof link.target === "number" ? link.target : -1);

        const isHighlighted =
          hoveredLinkIndex === index ||
          hoveredNodeIndex === sourceIdx ||
          hoveredNodeIndex === targetIdx;
        const isFaded = isAnyHovered && !isHighlighted;

        const handleMouseEnter = () => {
          setHoveredLinkIndex(index);
          setTooltipData({ type: "link", linkIndex: index, x: 0, y: 0, data: link });
        };
        const handleMouseLeave = () => {
          setHoveredLinkIndex(null);
          setTooltipData(null);
        };

        let linkStroke: string;
        const patternId = getLinkPattern?.(link, index);
        if (patternId) {
          linkStroke = `url(#${patternId})`;
        } else if (useGradient && !stroke && !getLinkColor) {
          linkStroke = `url(#link-gradient-${index})`;
        } else {
          linkStroke = getLinkColorFn(link, index);
        }

        return (
          <AnimatedLink
            key={`link-${sourceIdx}-${targetIdx}-${link.width ?? link.value ?? ""}`}
            animationDuration={animationDuration}
            fadedOpacity={fadedOpacity}
            index={index}
            isFaded={isFaded}
            isHighlighted={isHighlighted}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            path={path}
            stroke={linkStroke}
            strokeOpacity={strokeOpacity}
            totalLinks={links.length}
            width={linkWidth}
          />
        );
      })}
    </g>
  );
}

SankeyLink.displayName = "SankeyLink";
export default SankeyLink;
