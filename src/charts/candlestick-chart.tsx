import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CandlestickDatum {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickChartProps {
  data: CandlestickDatum[];
  /** CSS aspect-ratio string. Default: "3 / 2" */
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Bullish (close >= open) candle color. Default: "#10b981" */
  upColor?: string;
  /** Bearish (close < open) candle color. Default: "#ef4444" */
  downColor?: string;
  /** Wick stroke width in px. Default: 1 */
  wickWidth?: number;
  /** Minimum candle body height in px. Default: 1 */
  bodyMinHeight?: number;
  /** Show horizontal grid lines. Default: true */
  showGrid?: boolean;
  /** Show x-axis date labels. Default: true */
  showXAxis?: boolean;
  /** Show y-axis price labels. Default: true */
  showYAxis?: boolean;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
const Y_TICK_COUNT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Format as "Jan 15" */
const dateLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatDateLabel(d: string | Date): string {
  return dateLabel.format(toDate(d));
}

/** Simple number formatter (e.g. 1234.5 → "1,234.5") */
function formatPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ── Core rendering ────────────────────────────────────────────────────────────

interface CandlestickChartCoreProps {
  width: number;
  height: number;
  data: CandlestickDatum[];
  margin: { top: number; right: number; bottom: number; left: number };
  upColor: string;
  downColor: string;
  wickWidth: number;
  bodyMinHeight: number;
  showGrid: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
}

function CandlestickChartCore({
  width,
  height,
  data,
  margin,
  upColor,
  downColor,
  wickWidth,
  bodyMinHeight,
  showGrid,
  showXAxis,
  showYAxis,
}: CandlestickChartCoreProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Sort data by date ascending
  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => toDate(a.date).getTime() - toDate(b.date).getTime()
      ),
    [data]
  );

  // X scale: scaleBand over ISO date strings
  const dateKeys = useMemo(
    () => sorted.map((d) => toDate(d.date).toISOString()),
    [sorted]
  );

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: dateKeys,
        range: [0, innerWidth],
        padding: 0.2,
      }),
    [dateKeys, innerWidth]
  );

  // Y scale: from [minLow * 0.998, maxHigh * 1.002] → [innerHeight, 0]
  const { minLow, maxHigh } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of sorted) {
      if (d.low < lo) lo = d.low;
      if (d.high > hi) hi = d.high;
    }
    return { minLow: lo === Infinity ? 0 : lo, maxHigh: hi === -Infinity ? 1 : hi };
  }, [sorted]);

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [minLow * 0.998, maxHigh * 1.002],
        range: [innerHeight, 0],
        nice: false,
      }),
    [minLow, maxHigh, innerHeight]
  );

  const bandwidth = xScale.bandwidth();

  // Y-axis ticks
  const yTicks = useMemo(() => yScale.ticks(Y_TICK_COUNT), [yScale]);

  // X-axis: show roughly 6 labels evenly spaced
  const xLabelIndices = useMemo(() => {
    const n = sorted.length;
    if (n === 0) return [];
    const step = Math.max(1, Math.floor(n / 6));
    const indices: number[] = [];
    for (let i = 0; i < n; i += step) {
      indices.push(i);
    }
    // Always include last
    if (indices[indices.length - 1] !== n - 1) {
      indices.push(n - 1);
    }
    return indices;
  }, [sorted]);

  if (innerWidth <= 0 || innerHeight <= 0) return null;

  return (
    <svg
      aria-hidden="true"
      height={height}
      style={{ contain: "layout style paint", display: "block" }}
      width={width}
    >
      <Group left={margin.left} top={margin.top}>
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <line
                key={`grid-${tick}`}
                stroke="var(--chart-grid)"
                strokeWidth={1}
                x1={0}
                x2={innerWidth}
                y1={y}
                y2={y}
              />
            );
          })}

        {/* Y-axis */}
        {showYAxis &&
          yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <text
                key={`ytick-${tick}`}
                dominantBaseline="middle"
                fill="var(--chart-overlay)"
                fontSize={11}
                textAnchor="end"
                x={-8}
                y={y}
              >
                {formatPrice(tick)}
              </text>
            );
          })}

        {/* Candles enter animation wrapper */}
        <motion.g
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.6, ease: [0.85, 0, 0.15, 1] }}
        >
          {sorted.map((d, i) => {
            const key = toDate(d.date).toISOString();
            const x = xScale(key) ?? 0;
            const xMid = x + bandwidth / 2;
            const isUp = d.close >= d.open;
            const color = isUp ? upColor : downColor;

            const yHigh = yScale(d.high);
            const yLow = yScale(d.low);
            const yOpen = yScale(d.open);
            const yClose = yScale(d.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(bodyMinHeight, Math.abs(yOpen - yClose));

            const isHovered = hoveredIndex === i;
            const hasHover = hoveredIndex !== null;
            const opacity = hasHover ? (isHovered ? 1 : 0.6) : 1;

            return (
              <g
                key={key}
                style={{ opacity, cursor: "crosshair", transition: "opacity 0.15s ease" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Wick */}
                <line
                  stroke={color}
                  strokeWidth={wickWidth}
                  x1={xMid}
                  x2={xMid}
                  y1={yHigh}
                  y2={yLow}
                />
                {/* Body */}
                <rect
                  fill={color}
                  height={bodyHeight}
                  width={bandwidth}
                  x={x}
                  y={bodyTop}
                />
              </g>
            );
          })}
        </motion.g>

        {/* Vertical crosshair on hover */}
        {hoveredIndex !== null && (() => {
          const d = sorted[hoveredIndex];
          if (!d) return null;
          const key = toDate(d.date).toISOString();
          const x = xScale(key) ?? 0;
          const xMid = x + bandwidth / 2;
          return (
            <line
              pointerEvents="none"
              stroke="var(--chart-axis)"
              strokeDasharray="3 3"
              strokeWidth={1}
              x1={xMid}
              x2={xMid}
              y1={0}
              y2={innerHeight}
            />
          );
        })()}

        {/* X-axis */}
        {showXAxis && (
          <>
            <line
              stroke="var(--chart-crosshair)"
              strokeWidth={1}
              x1={0}
              x2={innerWidth}
              y1={innerHeight}
              y2={innerHeight}
            />
            {xLabelIndices.map((i) => {
              const d = sorted[i];
              if (!d) return null;
              const key = toDate(d.date).toISOString();
              const x = xScale(key) ?? 0;
              const xMid = x + bandwidth / 2;
              return (
                <text
                  key={`xlabel-${i}`}
                  dominantBaseline="hanging"
                  fill="var(--chart-overlay)"
                  fontSize={11}
                  textAnchor="middle"
                  x={xMid}
                  y={innerHeight + 8}
                >
                  {formatDateLabel(d.date)}
                </text>
              );
            })}
          </>
        )}
      </Group>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function CandlestickChart({
  data,
  aspectRatio = "3 / 2",
  margin: marginProp,
  upColor = "var(--chart-up)",
  downColor = "var(--chart-down)",
  wickWidth = 1,
  bodyMinHeight = 1,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  className,
}: CandlestickChartProps) {
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  const [measureRef, { width, height }] = useMeasure({ debounce: 10 });

  return (
    <div
      className={cn("relative w-full", className)}
      ref={measureRef}
      style={{ aspectRatio, overflow: "hidden" }}
    >
      {width > 0 && height > 0 && (
        <CandlestickChartCore
          bodyMinHeight={bodyMinHeight}
          data={data}
          downColor={downColor}
          height={height}
          margin={margin}
          showGrid={showGrid}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          upColor={upColor}
          wickWidth={wickWidth}
          width={width}
        />
      )}
    </div>
  );
}

CandlestickChart.displayName = "CandlestickChart";

export default CandlestickChart;
