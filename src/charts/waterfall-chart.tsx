import { scaleBand, scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import { motion } from "motion/react";
import { useMemo } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WaterfallItem {
  name: string;
  value: number;
  /** "total" renders from 0 (absolute), "delta" is default (cumulative) */
  type?: "total" | "delta";
}

export interface WaterfallChartProps {
  data: WaterfallItem[];
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
  connectorColor?: string;
  showConnectors?: boolean;
  showValues?: boolean;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 30, right: 20, bottom: 50, left: 50 };


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatValue(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${v < 0 ? "-" : "+"}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${v < 0 ? "-" : "+"}${(abs / 1_000).toFixed(1)}K`;
  return `${v >= 0 ? "+" : ""}${v}`;
}

function formatAxisTick(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return `${v}`;
}

// ── Bar segment data ──────────────────────────────────────────────────────────

interface BarSegment {
  name: string;
  value: number;
  baseline: number;
  barTop: number;   // the y-coordinate of the top of the logical bar (min of baseline, baseline+value)
  barHeight: number; // absolute pixel height (always positive)
  isTotal: boolean;
  isPositive: boolean;
}

function computeSegments(data: WaterfallItem[]): BarSegment[] {
  const segments: BarSegment[] = [];
  let runningTotal = 0;

  for (const item of data) {
    const isTotal = item.type === "total";
    const isPositive = item.value >= 0;

    let baseline: number;
    if (isTotal) {
      baseline = 0;
    } else if (isPositive) {
      baseline = runningTotal;
    } else {
      baseline = runningTotal + item.value;
    }

    segments.push({
      name: item.name,
      value: item.value,
      baseline,
      barTop: Math.min(baseline, baseline + item.value),
      barHeight: Math.abs(item.value),
      isTotal,
      isPositive,
    });

    if (!isTotal) {
      runningTotal += item.value;
    }
  }

  return segments;
}

// ── Inner chart ───────────────────────────────────────────────────────────────

interface WaterfallChartCoreProps extends Required<Omit<WaterfallChartProps, "aspectRatio" | "className">> {
  width: number;
  height: number;
}

function WaterfallChartCore({
  data,
  width,
  height,
  margin,
  positiveColor,
  negativeColor,
  totalColor,
  connectorColor,
  showConnectors,
  showValues,
}: WaterfallChartCoreProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth < 10 || innerHeight < 10) return null;

  const segments = useMemo(() => computeSegments(data), [data]);

  // Y domain: find global min and max across all segment ranges
  const allYValues = segments.flatMap((s) => [s.baseline, s.baseline + s.value]);
  const rawMin = Math.min(0, ...allYValues);
  const rawMax = Math.max(0, ...allYValues);
  const yPad = (rawMax - rawMin) * 0.1 || 1;
  const yMin = rawMin - yPad;
  const yMax = rawMax + yPad;

  const xScale = scaleBand({
    domain: segments.map((s) => s.name),
    range: [0, innerWidth],
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [yMin, yMax],
    range: [innerHeight, 0],
    nice: true,
  });

  const bandwidth = xScale.bandwidth();
  const rotateLabels = segments.length > 6;

  // Y-axis ticks
  const yTicks = yScale.ticks(5);

  const zeroY = yScale(0);

  return (
    <svg
      aria-hidden="true"
      height={height}
      style={{ contain: "layout style paint", display: "block" }}
      width={width}
    >
      <Group left={margin.left} top={margin.top}>
        {/* ── Grid lines ── */}
        {yTicks.map((tick) => {
          const ty = yScale(tick);
          return (
            <line
              key={`grid-${tick}`}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              x1={0}
              x2={innerWidth}
              y1={ty}
              y2={ty}
            />
          );
        })}

        {/* ── Zero baseline ── */}
        <line
          stroke="var(--chart-axis)"
          strokeWidth={1}
          x1={0}
          x2={innerWidth}
          y1={zeroY}
          y2={zeroY}
        />

        {/* ── Connector lines ── */}
        {showConnectors &&
          segments.map((seg, i) => {
            if (i >= segments.length - 1) return null;
            if (seg.isTotal) return null;
            const next = segments[i + 1];
            if (!next) return null;

            const x1 = (xScale(seg.name) ?? 0) + bandwidth;
            const x2 = xScale(next.name) ?? 0;
            // The connector goes from the top of the current bar's "end" position
            const connectorY = yScale(seg.isPositive ? seg.baseline + seg.value : seg.baseline);

            return (
              <line
                key={`conn-${i}`}
                stroke={connectorColor}
                strokeDasharray="4 3"
                strokeWidth={1}
                x1={x1}
                x2={x2}
                y1={connectorY}
                y2={connectorY}
              />
            );
          })}

        {/* ── Bars ── */}
        {segments.map((seg, i) => {
          const x = xScale(seg.name) ?? 0;
          const barTopY = yScale(seg.baseline + (seg.isPositive || seg.isTotal ? seg.value : 0));
          const barBottomY = yScale(seg.isTotal ? 0 : seg.isPositive ? seg.baseline : seg.baseline + seg.value);
          const rectH = Math.max(1, Math.abs(barBottomY - barTopY));
          const rectY = Math.min(barTopY, barBottomY);

          const color = seg.isTotal
            ? totalColor
            : seg.isPositive
            ? positiveColor
            : negativeColor;

          return (
            <motion.rect
              key={seg.name}
              animate={{ height: rectH, y: rectY }}
              fill={color}
              height={rectH}
              initial={{ height: 0, y: rectY + rectH }}
              rx={2}
              transition={{
                type: "tween",
                duration: 0.5,
                delay: i * 0.05,
                ease: [0.4, 0, 0.2, 1],
              }}
              width={bandwidth}
              x={x}
              y={rectY}
            />
          );
        })}

        {/* ── Value labels ── */}
        {showValues &&
          segments.map((seg, i) => {
            const x = (xScale(seg.name) ?? 0) + bandwidth / 2;
            const barTopY = yScale(seg.baseline + (seg.isPositive || seg.isTotal ? seg.value : 0));
            const barBottomY = yScale(seg.isTotal ? 0 : seg.isPositive ? seg.baseline : seg.baseline + seg.value);
            const rectY = Math.min(barTopY, barBottomY);
            const labelY = rectY - 5;

            const color = seg.isTotal
              ? totalColor
              : seg.isPositive
              ? positiveColor
              : negativeColor;

            return (
              <motion.text
                key={`val-${seg.name}`}
                animate={{ opacity: 1 }}
                dominantBaseline="auto"
                fill={color}
                fontFamily="inherit"
                fontSize={10}
                fontWeight={600}
                initial={{ opacity: 0 }}
                textAnchor="middle"
                transition={{ delay: i * 0.05 + 0.4, duration: 0.25 }}
                x={x}
                y={labelY}
              >
                {formatValue(seg.value)}
              </motion.text>
            );
          })}

        {/* ── Y-axis ticks + labels ── */}
        {yTicks.map((tick) => {
          const ty = yScale(tick);
          return (
            <g key={`ytick-${tick}`}>
              <line stroke="var(--chart-axis)" strokeWidth={0.5} x1={-4} x2={0} y1={ty} y2={ty} />
              <text
                dominantBaseline="middle"
                fill="var(--chart-label)"
                fontFamily="inherit"
                fontSize={10}
                textAnchor="end"
                x={-8}
                y={ty}
              >
                {formatAxisTick(tick)}
              </text>
            </g>
          );
        })}

        {/* ── X-axis labels ── */}
        {segments.map((seg) => {
          const x = (xScale(seg.name) ?? 0) + bandwidth / 2;
          const y = innerHeight + 12;

          return (
            <text
              key={`xlabel-${seg.name}`}
              dominantBaseline="hanging"
              fill="var(--chart-label)"
              fontFamily="inherit"
              fontSize={11}
              textAnchor={rotateLabels ? "end" : "middle"}
              transform={rotateLabels ? `rotate(-45, ${x}, ${y})` : undefined}
              x={x}
              y={y}
            >
              {seg.name}
            </text>
          );
        })}

        {/* ── Y-axis line ── */}
        <line
          stroke="var(--chart-axis)"
          strokeWidth={1}
          x1={0}
          x2={0}
          y1={0}
          y2={innerHeight}
        />
      </Group>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function WaterfallChart({
  data,
  aspectRatio = "2 / 1",
  margin = DEFAULT_MARGIN,
  positiveColor = "var(--chart-up)",
  negativeColor = "var(--chart-down)",
  totalColor = "var(--chart-neutral)",
  connectorColor = "var(--chart-crosshair)",
  showConnectors = true,
  showValues = true,
  className,
}: WaterfallChartProps) {
  const [ref, { width, height }] = useMeasure();

  return (
    <div
      className={cn("relative w-full select-none", className)}
      ref={ref}
      style={{ aspectRatio }}
    >
      {width > 0 && height > 0 && (
        <WaterfallChartCore
          connectorColor={connectorColor}
          data={data}
          height={height}
          margin={margin}
          negativeColor={negativeColor}
          positiveColor={positiveColor}
          showConnectors={showConnectors}
          showValues={showValues}
          totalColor={totalColor}
          width={width}
        />
      )}
    </div>
  );
}

export default WaterfallChart;
