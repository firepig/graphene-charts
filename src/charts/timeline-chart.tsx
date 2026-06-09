import { Group } from "@visx/group";
import { scaleTime } from "@visx/scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string;
  label: string;
  start: Date | string;
  end: Date | string;
  group?: string;
  color?: string;
  description?: string;
}

export interface TimelineChartProps {
  items: TimelineItem[];
  /** CSS aspect-ratio string. Default: "3 / 1" */
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Height of each bar in px. Default: 22 */
  barHeight?: number;
  /** Gap between bars. Default: 6 */
  barGap?: number;
  /** Bar corner radius. Default: 4 */
  cornerRadius?: number;
  /** Colors per group/item. */
  colorRange?: string[];
  /** Show vertical time grid lines. Default: true */
  showGrid?: boolean;
  /** Show label inside/beside bar. Default: true */
  showLabels?: boolean;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 36, left: 90 };
const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-up)",
  "var(--chart-down)",
  "var(--chart-neutral)",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

const tickFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

function formatTickDate(d: Date): string {
  return tickFormatter.format(d);
}

function formatTooltipDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

// ── Core rendering ────────────────────────────────────────────────────────────

interface TimelineChartCoreProps {
  width: number;
  items: TimelineItem[];
  margin: { top: number; right: number; bottom: number; left: number };
  barHeight: number;
  barGap: number;
  cornerRadius: number;
  colorRange: string[];
  showGrid: boolean;
  showLabels: boolean;
}

function TimelineChartCore({
  width,
  items,
  margin,
  barHeight,
  barGap,
  cornerRadius,
  colorRange,
  showGrid,
  showLabels,
}: TimelineChartCoreProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rowHeight = barHeight + barGap;

  // Parse all dates
  const parsedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        startDate: toDate(item.start),
        endDate: toDate(item.end),
      })),
    [items]
  );

  // Build ordered groups: unique group keys sorted by first item's start date
  const { groups, groupOrder } = useMemo(() => {
    const groupMap = new Map<string, { firstStart: Date; items: typeof parsedItems }>();
    for (const item of parsedItems) {
      const key = item.group ?? item.id;
      const existing = groupMap.get(key);
      if (!existing) {
        groupMap.set(key, { firstStart: item.startDate, items: [item] });
      } else {
        if (item.startDate < existing.firstStart) {
          existing.firstStart = item.startDate;
        }
        existing.items.push(item);
      }
    }
    const order = Array.from(groupMap.keys()).sort((a, b) => {
      const aStart = groupMap.get(a)!.firstStart.getTime();
      const bStart = groupMap.get(b)!.firstStart.getTime();
      return aStart - bStart;
    });
    return { groups: groupMap, groupOrder: order };
  }, [parsedItems]);

  // Domain extents
  const { minStart, maxEnd } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const item of parsedItems) {
      const s = item.startDate.getTime();
      const e = item.endDate.getTime();
      if (s < lo) lo = s;
      if (e > hi) hi = e;
    }
    return {
      minStart: lo === Infinity ? new Date() : new Date(lo),
      maxEnd: hi === -Infinity ? new Date() : new Date(hi),
    };
  }, [parsedItems]);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const totalHeight =
    margin.top + groupOrder.length * rowHeight + margin.bottom;
  const innerHeight = Math.max(0, totalHeight - margin.top - margin.bottom);

  // X scale with 2% padding on each side
  const xScale = useMemo(() => {
    const span = maxEnd.getTime() - minStart.getTime();
    const pad = span * 0.02;
    return scaleTime<number>({
      domain: [new Date(minStart.getTime() - pad), new Date(maxEnd.getTime() + pad)],
      range: [0, innerWidth],
    });
  }, [minStart, maxEnd, innerWidth]);

  const xTicks = useMemo(() => xScale.ticks(6), [xScale]);

  if (innerWidth <= 0) return null;

  return (
    <svg
      aria-hidden="true"
      height={totalHeight}
      style={{ contain: "layout style paint", display: "block" }}
      width={width}
    >
      <Group left={margin.left} top={margin.top}>
        {/* Vertical grid lines */}
        {showGrid &&
          xTicks.map((tick) => {
            const x = xScale(tick);
            return (
              <line
                key={`grid-${tick.getTime()}`}
                stroke="var(--chart-grid)"
                strokeDasharray="4 4"
                strokeWidth={1}
                x1={x}
                x2={x}
                y1={0}
                y2={innerHeight}
              />
            );
          })}

        {/* Bars */}
        {groupOrder.map((groupKey, rowIndex) => {
          const rowItems = groups.get(groupKey)!.items;
          const rowY = rowIndex * rowHeight;
          const barY = rowY + (rowHeight - barHeight) / 2;
          const rowLabel = groupKey;
          const groupColor = colorRange[rowIndex % colorRange.length];

          return (
            <g key={groupKey}>
              {/* Row label in left margin */}
              <text
                dominantBaseline="middle"
                fill="var(--chart-foreground-muted)"
                fontSize={11}
                textAnchor="end"
                x={-8}
                y={rowY + rowHeight / 2}
              >
                {truncate(rowLabel, 12)}
              </text>

              {/* Bars for this row */}
              {rowItems.map((item, barIdx) => {
                const xStart = xScale(item.startDate);
                const xEnd = xScale(item.endDate);
                const barWidth = Math.max(2, xEnd - xStart);
                const fill = item.color ?? groupColor;
                const isHovered = hoveredId === item.id;
                const hasHover = hoveredId !== null;

                const tooltipText = item.description
                  ? item.description
                  : `${item.label} — ${formatTooltipDate(item.startDate)} → ${formatTooltipDate(item.endDate)}`;

                const labelInside = barWidth > 40;

                return (
                  <g
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <motion.rect
                      animate={{ width: barWidth }}
                      fill={fill}
                      height={barHeight}
                      initial={{ width: 0 }}
                      rx={cornerRadius}
                      style={{
                        filter: isHovered ? "brightness(1.25)" : "none",
                        transition: "filter 0.15s ease",
                      }}
                      transition={{
                        duration: 0.5,
                        delay: (rowIndex * groups.size + barIdx) * 0.04,
                        ease: [0.85, 0, 0.15, 1],
                      }}
                      x={xStart}
                      y={barY}
                    />

                    {/* Tooltip */}
                    {isHovered && (
                      <title>{tooltipText}</title>
                    )}

                    {/* Bar label */}
                    {showLabels && (
                      labelInside ? (
                        <text
                          dominantBaseline="middle"
                          fill="var(--chart-tooltip-foreground)"
                          fontSize={10}
                          pointerEvents="none"
                          style={{ userSelect: "none" }}
                          textAnchor="start"
                          x={xStart + 6}
                          y={barY + barHeight / 2}
                        >
                          {truncate(item.label, Math.floor((barWidth - 12) / 6))}
                        </text>
                      ) : (
                        <text
                          dominantBaseline="middle"
                          fill="var(--chart-foreground-muted)"
                          fontSize={10}
                          pointerEvents="none"
                          style={{ userSelect: "none" }}
                          textAnchor="start"
                          x={xStart + barWidth + 4}
                          y={barY + barHeight / 2}
                        >
                          {truncate(item.label, 12)}
                        </text>
                      )
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Time axis */}
        <line
          stroke="var(--chart-crosshair)"
          strokeWidth={1}
          x1={0}
          x2={innerWidth}
          y1={innerHeight}
          y2={innerHeight}
        />
        {xTicks.map((tick) => {
          const x = xScale(tick);
          return (
            <text
              key={`xtick-${tick.getTime()}`}
              dominantBaseline="hanging"
              fill="var(--chart-overlay)"
              fontSize={11}
              textAnchor="middle"
              x={x}
              y={innerHeight + 8}
            >
              {formatTickDate(tick)}
            </text>
          );
        })}
      </Group>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function TimelineChart({
  items,
  aspectRatio = "3 / 1",
  margin: marginProp,
  barHeight = 22,
  barGap = 6,
  cornerRadius = 4,
  colorRange = DEFAULT_COLORS,
  showGrid = true,
  showLabels = true,
  className,
}: TimelineChartProps) {
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  const [measureRef, { width }] = useMeasure({ debounce: 10 });

  return (
    <div
      className={cn("relative w-full", className)}
      ref={measureRef}
      style={{ overflow: "hidden" }}
    >
      {width > 0 && (
        <TimelineChartCore
          barGap={barGap}
          barHeight={barHeight}
          colorRange={colorRange}
          cornerRadius={cornerRadius}
          items={items}
          margin={margin}
          showGrid={showGrid}
          showLabels={showLabels}
          width={width}
        />
      )}
    </div>
  );
}

TimelineChart.displayName = "TimelineChart";

export default TimelineChart;
