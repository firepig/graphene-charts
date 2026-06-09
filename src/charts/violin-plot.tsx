import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ViolinDatum {
  label: string;
  /** Raw data points — component computes KDE */
  values: number[];
  color?: string;
}

export interface ViolinPlotChartProps {
  data: ViolinDatum[];
  /** CSS aspect-ratio string. Default: "2 / 1" */
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  colorRange?: string[];
  /** KDE bandwidth multiplier. Default: 1 */
  bandwidthScale?: number;
  /** Fraction of band width for violin. Default: 0.7 */
  violinWidth?: number;
  /** Show median dot. Default: true */
  showMedian?: boolean;
  /** Show Q1–Q3 bar. Default: true */
  showQuartiles?: boolean;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
const DEFAULT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const Y_TICK_COUNT = 5;
const KDE_POINTS = 80;

// ── Helpers ───────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function epanechnikovKernel(bandwidth: number) {
  return (u: number) => {
    u = u / bandwidth;
    return Math.abs(u) <= 1 ? (0.75 * (1 - u * u)) / bandwidth : 0;
  };
}

function kernelDensityEstimator(
  kernel: (v: number) => number,
  thresholds: number[]
) {
  return (values: number[]): [number, number][] =>
    thresholds.map((x) => [x, mean(values.map((v) => kernel(x - v)))] as [number, number]);
}

function buildViolinPath(
  densityPoints: [number, number][],
  xMid: number,
  maxHalfWidth: number,
  maxDensity: number,
  yScale: (v: number) => number
): string {
  if (densityPoints.length === 0) return "";

  const densityToWidth = (d: number): number =>
    maxDensity > 0 ? (d / maxDensity) * maxHalfWidth : 0;

  const rightSide = densityPoints.map(([y, d]) => [
    xMid + densityToWidth(d),
    yScale(y),
  ]);
  const leftSide = [...densityPoints]
    .reverse()
    .map(([y, d]) => [xMid - densityToWidth(d), yScale(y)]);

  return (
    [...rightSide, ...leftSide]
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
      .join(" ") + "Z"
  );
}

function formatValue(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ── Core rendering ────────────────────────────────────────────────────────────

interface ViolinPlotChartCoreProps {
  width: number;
  height: number;
  data: ViolinDatum[];
  margin: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  bandwidthScale: number;
  violinWidthFraction: number;
  showMedian: boolean;
  showQuartiles: boolean;
}

function ViolinPlotChartCore({
  width,
  height,
  data,
  margin,
  colors,
  bandwidthScale,
  violinWidthFraction,
  showMedian,
  showQuartiles,
}: ViolinPlotChartCoreProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Global min/max across all data
  const { globalMin, globalMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of data) {
      for (const v of d.values) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    return {
      globalMin: lo === Infinity ? 0 : lo,
      globalMax: hi === -Infinity ? 1 : hi,
    };
  }, [data]);

  const range = globalMax - globalMin;
  const yDomainMin = globalMin - range * 0.05;
  const yDomainMax = globalMax + range * 0.05;

  const labels = useMemo(() => data.map((d) => d.label), [data]);

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: labels,
        range: [0, innerWidth],
        padding: 0.3,
      }),
    [labels, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [yDomainMin, yDomainMax],
        range: [innerHeight, 0],
        nice: false,
      }),
    [yDomainMin, yDomainMax, innerHeight]
  );

  const bandwidth = xScale.bandwidth();

  // KDE bandwidth
  const kdeBandwidth = useMemo(
    () => (yDomainMax - yDomainMin) * 0.15 * bandwidthScale,
    [yDomainMin, yDomainMax, bandwidthScale]
  );

  // KDE thresholds: 80 evenly spaced points
  const thresholds = useMemo(() => {
    const step = (yDomainMax - yDomainMin) / (KDE_POINTS - 1);
    return Array.from({ length: KDE_POINTS }, (_, i) => yDomainMin + i * step);
  }, [yDomainMin, yDomainMax]);

  // Precompute per-group KDE + stats
  const groupData = useMemo(() => {
    const kernel = epanechnikovKernel(kdeBandwidth);
    const estimator = kernelDensityEstimator(kernel, thresholds);

    return data.map((d) => {
      const sorted = [...d.values].sort((a, b) => a - b);
      const densityPoints = estimator(d.values);
      const maxDensity = Math.max(...densityPoints.map(([, dens]) => dens), 1e-10);
      const med = quantile(sorted, 0.5);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      return { densityPoints, maxDensity, median: med, q1, q3 };
    });
  }, [data, thresholds, kdeBandwidth]);

  const yTicks = useMemo(() => yScale.ticks(Y_TICK_COUNT), [yScale]);

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
        {yTicks.map((tick) => {
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

        {/* Y-axis labels */}
        {yTicks.map((tick) => {
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
              {formatValue(tick)}
            </text>
          );
        })}

        {/* Violins */}
        {data.map((d, i) => {
          const color = d.color ?? colors[i % colors.length];
          const bandPos = xScale(d.label) ?? 0;
          const xMid = bandPos + bandwidth / 2;
          const maxHalfWidth = (violinWidthFraction * bandwidth) / 2;

          const { densityPoints, maxDensity, median, q1, q3 } = groupData[i];

          const pathData = buildViolinPath(
            densityPoints,
            xMid,
            maxHalfWidth,
            maxDensity,
            (v) => yScale(v)
          );

          const isHovered = hoveredLabel === d.label;
          const hasHover = hoveredLabel !== null;
          const opacity = hasHover ? (isHovered ? 1 : 0.5) : 1;
          const filter = isHovered ? `drop-shadow(0 0 6px ${color})` : "none";

          const yQ1 = yScale(q1);
          const yQ3 = yScale(q3);
          const yMedian = yScale(median);
          const quartileTop = Math.min(yQ1, yQ3);
          const quartileHeight = Math.max(1, Math.abs(yQ1 - yQ3));

          return (
            <g
              key={d.label}
              style={{ opacity, filter, cursor: "crosshair", transition: "opacity 0.15s ease, filter 0.15s ease" }}
              onMouseEnter={() => setHoveredLabel(d.label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              {/* Violin shape */}
              <motion.path
                animate={{ opacity: 1 }}
                d={pathData}
                fill={color}
                fillOpacity={0.55}
                initial={{ opacity: 0 }}
                stroke={color}
                strokeOpacity={1}
                strokeWidth={1.5}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.85, 0, 0.15, 1] }}
              />

              {/* Q1-Q3 bar */}
              {showQuartiles && (
                <rect
                  fill="var(--chart-overlay)"
                  height={quartileHeight}
                  pointerEvents="none"
                  width={2}
                  x={xMid - 1}
                  y={quartileTop}
                />
              )}

              {/* Median dot */}
              {showMedian && (
                <circle
                  cx={xMid}
                  cy={yMedian}
                  fill="var(--chart-overlay)"
                  pointerEvents="none"
                  r={4}
                />
              )}
            </g>
          );
        })}

        {/* X-axis baseline + labels */}
        <line
          stroke="var(--chart-crosshair)"
          strokeWidth={1}
          x1={0}
          x2={innerWidth}
          y1={innerHeight}
          y2={innerHeight}
        />
        {labels.map((label) => {
          const bandPos = xScale(label) ?? 0;
          const xMid = bandPos + bandwidth / 2;
          return (
            <text
              key={`xlabel-${label}`}
              dominantBaseline="hanging"
              fill="var(--chart-overlay)"
              fontSize={11}
              textAnchor="middle"
              x={xMid}
              y={innerHeight + 8}
            >
              {label}
            </text>
          );
        })}
      </Group>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function ViolinPlotChart({
  data,
  aspectRatio = "2 / 1",
  margin: marginProp,
  colorRange,
  bandwidthScale = 1,
  violinWidth = 0.7,
  showMedian = true,
  showQuartiles = true,
  className,
}: ViolinPlotChartProps) {
  const margin = { ...DEFAULT_MARGIN, ...marginProp };
  const colors = colorRange ?? DEFAULT_COLORS;
  const [measureRef, { width, height }] = useMeasure({ debounce: 10 });

  return (
    <div
      className={cn("relative w-full", className)}
      ref={measureRef}
      style={{ aspectRatio, overflow: "hidden" }}
    >
      {width > 0 && height > 0 && (
        <ViolinPlotChartCore
          bandwidthScale={bandwidthScale}
          colors={colors}
          data={data}
          height={height}
          margin={margin}
          showMedian={showMedian}
          showQuartiles={showQuartiles}
          violinWidthFraction={violinWidth}
          width={width}
        />
      )}
    </div>
  );
}

ViolinPlotChart.displayName = "ViolinPlotChart";

export default ViolinPlotChart;
