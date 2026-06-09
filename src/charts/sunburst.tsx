import { hierarchy } from "@visx/hierarchy";
import { partition as d3partition } from "d3-hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { arc as d3arc } from "d3-shape";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
  color?: string;
}

export interface SunburstChartProps {
  data: SunburstNode;
  /** Fixed px size; if omitted, fills parent square */
  size?: number;
  className?: string;
  colorRange?: string[];
  /** Show name in arc if it fits. Default true */
  showLabels?: boolean;
  /** Center hole radius in px. Default 0 (solid). Set e.g. 40 for donut style */
  innerRadius?: number;
  /** Gap between arcs in radians. Default 0.008 */
  padAngle?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_COLOR_RANGE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-up)",
  "var(--chart-down)",
  "var(--chart-neutral)",
];

// ── Arc generator (d3-shape) ──────────────────────────────────────────────────

const arcGen = d3arc<HierarchyRectangularNode<SunburstNode>>()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .innerRadius((d) => d.y0)
  .outerRadius((d) => d.y1 - 1); // -1 gap between rings

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Unique key for a hierarchy node */
function nodeKey(d: HierarchyRectangularNode<SunburstNode>): string {
  return d.data.name + String(d.depth);
}

/** Mid-angle of an arc */
function midAngle(d: HierarchyRectangularNode<SunburstNode>): number {
  return (d.x0 + d.x1) / 2;
}

/** Mid-radius of an arc */
function midRadius(d: HierarchyRectangularNode<SunburstNode>): number {
  return (d.y0 + d.y1) / 2;
}

/** Truncate a label to ~12 chars */
function truncate(s: string, max = 12): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

// ── Inner renderer ────────────────────────────────────────────────────────────

interface SunburstInnerProps {
  width: number;
  data: SunburstNode;
  colorRange: string[];
  showLabels: boolean;
  innerRadius: number;
  padAngle: number;
}

function SunburstInner({
  width,
  data,
  colorRange,
  showLabels,
  innerRadius,
  padAngle,
}: SunburstInnerProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const size = width;
  if (size < 10) return null;

  const padding = 8;
  const maxRadius = size / 2 - padding;

  // Build hierarchy and compute partition layout
  const { nodes, maxDepth, depthColorMap } = useMemo(() => {
    const root = hierarchy<SunburstNode>(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    // Compute max depth (excluding root)
    let maxD = 0;
    root.each((node) => {
      if (node.depth > maxD) maxD = node.depth;
    });
    if (maxD === 0) maxD = 1;

    const ringWidth = (maxRadius - innerRadius) / maxD;

    // partition layout maps x0/x1 to angles, y0/y1 to radii tiers
    // We override y0/y1 manually after layout to control ring widths
    d3partition<SunburstNode>().size([2 * Math.PI, maxD])(root);

    // Remap radii: y0/y1 in partition are integer depths (0..maxD)
    // We convert them to actual pixel radii
    const allNodes: HierarchyRectangularNode<SunburstNode>[] = [];
    root.each((node) => {
      const n = node as HierarchyRectangularNode<SunburstNode>;
      // Remap: depth 0 → innerRadius, depth maxD → maxRadius
      (n as any).y0 = innerRadius + n.y0 * ringWidth;
      (n as any).y1 = innerRadius + n.y1 * ringWidth;
      // Apply padAngle to x0/x1
      if (n.x1 - n.x0 > padAngle * 2) {
        (n as any).x0 = n.x0 + padAngle / 2;
        (n as any).x1 = n.x1 - padAngle / 2;
      }
      allNodes.push(n);
    });

    // Build depth-1 color map by index
    const colorMap = new Map<string, string>();
    let colorIdx = 0;
    root.children?.forEach((child) => {
      const c = child as HierarchyRectangularNode<SunburstNode>;
      const col =
        child.data.color ?? colorRange[colorIdx % colorRange.length] ?? colorRange[0];
      colorMap.set(nodeKey(c), col);
      colorIdx++;
    });

    return { nodes: allNodes, maxDepth: maxD, depthColorMap: colorMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, innerRadius, maxRadius, padAngle, colorRange]);

  /** Resolve fill color for a node */
  function resolveColor(node: HierarchyRectangularNode<SunburstNode>): string {
    if (node.depth === 0) return "transparent";

    // Walk up to depth-1 ancestor
    let ancestor: HierarchyRectangularNode<SunburstNode> = node;
    while (ancestor.depth > 1 && ancestor.parent) {
      ancestor = ancestor.parent as HierarchyRectangularNode<SunburstNode>;
    }

    return (
      node.data.color ??
      depthColorMap.get(nodeKey(ancestor)) ??
      colorRange[0] ??
      "var(--chart-1)"
    );
  }

  /** Opacity fades with depth */
  function resolveOpacity(node: HierarchyRectangularNode<SunburstNode>): number {
    return Math.max(0.3, 1 - node.depth * 0.15);
  }

  // Non-root nodes only
  const renderNodes = nodes.filter((n) => n.depth > 0);

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      style={{ contain: "layout style paint", display: "block" }}
    >
      <g transform={`translate(${size / 2},${size / 2})`}>
        {/* Arcs */}
        {renderNodes.map((node, i) => {
          const key = nodeKey(node);
          const isHovered = hoveredKey === key;
          const path = arcGen(node) ?? "";
          const color = resolveColor(node);
          const baseOpacity = resolveOpacity(node);

          // When something is hovered, non-hovered arcs fade
          const opacity = hoveredKey
            ? isHovered
              ? baseOpacity
              : baseOpacity * 0.75
            : baseOpacity;

          const filter = isHovered ? "brightness(1.3)" : undefined;

          const angleSpan = node.x1 - node.x0;
          const radiusSpan = node.y1 - node.y0;
          const showLabel =
            showLabels && angleSpan > 0.2 && radiusSpan > 18;

          // Label position: midpoint of arc
          const mid = midAngle(node);
          const r = midRadius(node);
          // Convert polar to Cartesian (SVG: angle 0 = top, going clockwise)
          // d3-shape angles: 0 = 12 o'clock position is -PI/2 in standard math,
          // but d3 partition starts at 0 = right and goes clockwise.
          // Actually d3 partition: x0/x1 are angles starting at 0 (top in our
          // coordinate system because we use startAngle from d3arc which uses
          // the convention 0 = 12 o'clock). Wait — d3arc startAngle/endAngle
          // treat 0 as 12 o'clock (top), counting clockwise. But partition
          // maps to [0, 2*PI] — so 0 = top, PI = bottom.
          const lx = Math.sin(mid) * r;
          const ly = -Math.cos(mid) * r;
          // Rotation so text follows arc tangent
          const labelRotation = ((mid - Math.PI / 2) * 180) / Math.PI;
          // Flip text if it would be upside-down (bottom half)
          const shouldFlip = mid > Math.PI;
          const textRotation = shouldFlip
            ? labelRotation + 180
            : labelRotation;

          return (
            <motion.g
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.02,
                duration: 0.35,
                ease: "easeOut",
              }}
              style={{ originX: "0px", originY: "0px" }}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <path
                d={path}
                fill={color}
                opacity={opacity}
                style={{
                  cursor: "default",
                  filter,
                  transition: "opacity 0.15s ease, filter 0.15s ease",
                }}
              />
              {showLabel && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fill="var(--chart-foreground)"
                  transform={`rotate(${textRotation}, ${lx}, ${ly})`}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {truncate(node.data.name)}
                </text>
              )}
            </motion.g>
          );
        })}

        {/* Center label — root node name */}
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={innerRadius > 20 ? 13 : 11}
          fontWeight={600}
          fill="var(--chart-tooltip-foreground)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {data.name.length > 14 ? data.name.slice(0, 13) + "…" : data.name}
        </text>
      </g>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function SunburstChart({
  data,
  size: fixedSize,
  className,
  colorRange = DEFAULT_COLOR_RANGE,
  showLabels = true,
  innerRadius = 0,
  padAngle = 0.008,
}: SunburstChartProps) {
  const [measureRef, bounds] = useMeasure({ debounce: 10 });

  const sharedProps = {
    data,
    colorRange,
    showLabels,
    innerRadius,
    padAngle,
  };

  if (fixedSize) {
    return (
      <div
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: fixedSize, height: fixedSize }}
      >
        <SunburstInner width={fixedSize} {...sharedProps} />
      </div>
    );
  }

  const measuredWidth = bounds.width ?? 0;

  return (
    <div
      className={cn("relative aspect-square w-full", className)}
      ref={measureRef}
    >
      {measuredWidth > 0 ? (
        <SunburstInner width={measuredWidth} {...sharedProps} />
      ) : null}
    </div>
  );
}

SunburstChart.displayName = "SunburstChart";

export default SunburstChart;
