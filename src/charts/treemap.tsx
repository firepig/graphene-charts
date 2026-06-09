import { hierarchy, Treemap, treemapSquarify } from "@visx/hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import { motion } from "motion/react";
import { useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
  color?: string;
}

export interface TreemapChartProps {
  data: TreemapNode;
  /** Fixed px size; if omitted, fills parent (aspect ratio 4/3) */
  size?: number;
  /** Default "4 / 3" */
  aspectRatio?: string;
  className?: string;
  /** Padding between tiles, default 2 */
  padding?: number;
  /** Colors for leaf nodes; cycles if more nodes than colors */
  colorRange?: string[];
  /** Show node name labels, default true */
  showLabels?: boolean;
  /** Show numeric values, default true */
  showValues?: boolean;
  /** Min tile area (px²) to show label, default 1200 */
  minLabelSize?: number;
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

// ── Inner renderer ────────────────────────────────────────────────────────────

interface TreemapInnerProps {
  width: number;
  height: number;
  data: TreemapNode;
  padding: number;
  colorRange: string[];
  showLabels: boolean;
  showValues: boolean;
  minLabelSize: number;
}

function TreemapInner({
  width,
  height,
  data,
  padding,
  colorRange,
  showLabels,
  showValues,
  minLabelSize,
}: TreemapInnerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (width < 10 || height < 10) return null;

  const tileWidth = width - 2 * padding;
  const tileHeight = height - 2 * padding;

  const root = hierarchy<TreemapNode>(data).sum((d) => d.value ?? 0);

  // Collect leaf nodes in order to assign colors by index
  const leaves: HierarchyRectangularNode<TreemapNode>[] = [];

  return (
    <svg
      aria-hidden="true"
      height={height}
      style={{ contain: "layout style paint", display: "block" }}
      width={width}
    >
      <Treemap<TreemapNode>
        root={root}
        size={[tileWidth, tileHeight]}
        tile={treemapSquarify}
        paddingInner={padding}
        round
      >
        {(treemap) => {
          // Collect leaves in render order so we can assign stable color indices
          const allLeaves = treemap.leaves();
          leaves.length = 0;
          leaves.push(...allLeaves);

          return (
            <g transform={`translate(${padding},${padding})`}>
              {allLeaves.map((node, i) => {
                const nodeWidth = node.x1 - node.x0;
                const nodeHeight = node.y1 - node.y0;
                const area = nodeWidth * nodeHeight;
                const nodeId = node
                  .ancestors()
                  .map((n) => n.data.name)
                  .reverse()
                  .join("/");

                const isHovered = hoveredId === nodeId;

                const color =
                  node.data.color ??
                  colorRange[i % colorRange.length] ??
                  colorRange[0];

                const centerX = node.x0 + nodeWidth / 2;
                const centerY = node.y0 + nodeHeight / 2;

                const showNodeLabel =
                  (showLabels || showValues) && area >= minLabelSize;

                return (
                  <motion.g
                    key={nodeId}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: i * 0.03,
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                    style={{ originX: `${centerX}px`, originY: `${centerY}px` }}
                    onMouseEnter={() => setHoveredId(nodeId)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <rect
                      x={node.x0}
                      y={node.y0}
                      width={nodeWidth}
                      height={nodeHeight}
                      rx={4}
                      fill={color}
                      opacity={isHovered ? 1 : 0.85}
                      stroke={
                        isHovered ? "var(--chart-overlay)" : "transparent"
                      }
                      strokeWidth={isHovered ? 1 : 0}
                      style={{ cursor: "default" }}
                    />
                    {showNodeLabel && (
                      <foreignObject
                        x={node.x0 + 6}
                        y={node.y0}
                        width={Math.max(0, nodeWidth - 12)}
                        height={nodeHeight}
                        style={{ pointerEvents: "none" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            height: "100%",
                            gap: 2,
                            overflow: "hidden",
                          }}
                        >
                          {showLabels && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--chart-foreground)",
                                lineHeight: 1.2,
                                textAlign: "center",
                                wordBreak: "break-word",
                                maxWidth: "100%",
                              }}
                            >
                              {node.data.name}
                            </span>
                          )}
                          {showValues && node.data.value !== undefined && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--chart-foreground-muted)",
                                lineHeight: 1.2,
                                textAlign: "center",
                              }}
                            >
                              {node.data.value}
                            </span>
                          )}
                        </div>
                      </foreignObject>
                    )}
                  </motion.g>
                );
              })}
            </g>
          );
        }}
      </Treemap>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function TreemapChart({
  data,
  size,
  aspectRatio = "4 / 3",
  className,
  padding = 2,
  colorRange = DEFAULT_COLOR_RANGE,
  showLabels = true,
  showValues = true,
  minLabelSize = 1200,
}: TreemapChartProps) {
  const [measureRef, bounds] = useMeasure({ debounce: 10 });

  if (size) {
    return (
      <div
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <TreemapInner
          width={size}
          height={size}
          data={data}
          padding={padding}
          colorRange={colorRange}
          showLabels={showLabels}
          showValues={showValues}
          minLabelSize={minLabelSize}
        />
      </div>
    );
  }

  const width = bounds.width ?? 0;
  const height = bounds.height ?? 0;

  return (
    <div
      className={cn("relative w-full", className)}
      ref={measureRef}
      style={{ aspectRatio, overflow: "hidden" }}
    >
      {width > 0 && height > 0 ? (
        <TreemapInner
          width={width}
          height={height}
          data={data}
          padding={padding}
          colorRange={colorRange}
          showLabels={showLabels}
          showValues={showValues}
          minLabelSize={minLabelSize}
        />
      ) : null}
    </div>
  );
}

export default TreemapChart;
