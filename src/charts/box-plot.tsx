import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BoxPlotDatum {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
  color?: string;
}

export interface BoxPlotChartProps {
  data: BoxPlotDatum[];
  /** CSS aspect-ratio string. Default: "2 / 1" */
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  colorRange?: string[];
  /** Default: "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Show outlier dots. Default: true */
  showOutliers?: boolean;
  /** Show a diamond marker at mean if provided. Default: false */
  showMean?: boolean;
  /** Fraction of band width for box. Default: 0.5 */
  boxWidth?: number;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
const DEFAULT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const Y_TICK_COUNT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatValue(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ── Core rendering ────────────────────────────────────────────────────────────

interface BoxPlotChartCoreProps {
  width: number;
  height: number;
  data: BoxPlotDatum[];
  margin: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  orientation: "vertical" | "horizontal";
  showOutliers: boolean;
  showMean: boolean;
  boxWidthFraction: number;
}

function BoxPlotChartCore({
  width,
  height,
  data,
  margin,
  colors,
  orientation,
  showOutliers,
  boxWidthFraction,
}: BoxPlotChartCoreProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Global min/max across all data for value scale
  const { globalMin, globalMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of data) {
      const allVals = [d.min, d.max, ...(d.outliers ?? [])];
      for (const v of allVals) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    return {
      globalMin: lo === Infinity ? 0 : lo,
      globalMax: hi === -Infinity ? 1 : hi,
    };
  }, [data]);

  const paddedMin = globalMin * (globalMin >= 0 ? 0.95 : 1.05);
  const paddedMax = globalMax * (globalMax >= 0 ? 1.05 : 0.95);

  const labels = useMemo(() => data.map((d) => d.label), [data]);

  // For vertical: x = band (categorical), y = linear (values)
  // For horizontal: y = band (categorical), x = linear (values)
  const bandScale = useMemo(
    () =>
      scaleBand<string>({
        domain: labels,
        range: orientation === "vertical" ? [0, innerWidth] : [0, innerHeight],
        padding: 0.3,
      }),
    [labels, innerWidth, innerHeight, orientation]
  );

  const valueScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [paddedMin, paddedMax],
        range: orientation === "vertical" ? [innerHeight, 0] : [0, innerWidth],
        nice: false,
      }),
    [paddedMin, paddedMax, innerHeight, innerWidth, orientation]
  );

  const bandwidth = bandScale.bandwidth();
  const yTicks = useMemo(() => valueScale.ticks(Y_TICK_COUNT), [valueScale]);

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
          const vPos = valueScale(tick);
          return orientation === "vertical" ? (
            <line
              key={`grid-${tick}`}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              x1={0}
              x2={innerWidth}
              y1={vPos}
              y2={vPos}
            />
          ) : (
            <line
              key={`grid-${tick}`}
              stroke="var(--chart-grid)"
              strokeWidth={1}
              x1={vPos}
              x2={vPos}
              y1={0}
              y2={innerHeight}
            />
          );
        })}

        {/* Y-axis labels (value axis) */}
        {yTicks.map((tick) => {
          const vPos = valueScale(tick);
          return orientation === "vertical" ? (
            <text
              key={`ytick-${tick}`}
              dominantBaseline="middle"
              fill="var(--chart-overlay)"
              fontSize={11}
              textAnchor="end"
              x={-8}
              y={vPos}
            >
              {formatValue(tick)}
            </text>
          ) : (
            <text
              key={`ytick-${tick}`}
              dominantBaseline="hanging"
              fill="var(--chart-overlay)"
              fontSize={11}
              textAnchor="middle"
              x={vPos}
              y={innerHeight + 8}
            >
              {formatValue(tick)}
            </text>
          );
        })}

        {/* Boxes */}
        {data.map((d, i) => {
          const color = d.color ?? colors[i % colors.length];
          const bandPos = bandScale(d.label) ?? 0;
          const bandMid = bandPos + bandwidth / 2;
          const boxHalfWidth = (boxWidthFraction * bandwidth) / 2;
          const capHalfWidth = boxHalfWidth * 0.4;

          const isHovered = hoveredLabel === d.label;
          const hasHover = hoveredLabel !== null;
          const opacity = hasHover ? (isHovered ? 1 : 0.5) : 1;
          const filter = isHovered ? `drop-shadow(0 0 6px ${color})` : "none";

          if (orientation === "vertical") {
            const yMin = valueScale(d.min);
            const yMax = valueScale(d.max);
            const yQ1 = valueScale(d.q1);
            const yQ3 = valueScale(d.q3);
            const yMedian = valueScale(d.median);
            const boxTop = Math.min(yQ1, yQ3);
            const boxBottom = Math.max(yQ1, yQ3);
            const boxHeight = Math.max(1, boxBottom - boxTop);
            const xLeft = bandMid - boxHalfWidth;

            return (
              <g
                key={d.label}
                style={{ opacity, filter, cursor: "crosshair", transition: "opacity 0.15s ease, filter 0.15s ease" }}
                onMouseEnter={() => setHoveredLabel(d.label)}
                onMouseLeave={() => setHoveredLabel(null)}
              >
                {/* Whisker line min to max */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={bandMid}
                  x2={bandMid}
                  y1={yMin}
                  y2={yMax}
                />
                {/* Whisker cap at max */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={bandMid - capHalfWidth}
                  x2={bandMid + capHalfWidth}
                  y1={yMax}
                  y2={yMax}
                />
                {/* Whisker cap at min */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={bandMid - capHalfWidth}
                  x2={bandMid + capHalfWidth}
                  y1={yMin}
                  y2={yMin}
                />
                {/* Box body */}
                <motion.rect
                  animate={{ height: boxHeight, y: boxTop }}
                  fill={color}
                  fillOpacity={0.7}
                  height={boxHeight}
                  initial={{ height: 0, y: yMedian }}
                  rx={3}
                  stroke={color}
                  strokeOpacity={1}
                  strokeWidth={1.5}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.85, 0, 0.15, 1] }}
                  width={boxHalfWidth * 2}
                  x={xLeft}
                  y={boxTop}
                />
                {/* Median line */}
                <line
                  pointerEvents="none"
                  stroke="var(--chart-overlay)"
                  strokeWidth={2}
                  x1={xLeft}
                  x2={xLeft + boxHalfWidth * 2}
                  y1={yMedian}
                  y2={yMedian}
                />
                {/* Outlier dots */}
                {showOutliers &&
                  (d.outliers ?? []).map((outlier, oi) => (
                    <circle
                      key={`outlier-${oi}`}
                      cx={bandMid}
                      cy={valueScale(outlier)}
                      fill={color}
                      fillOpacity={0.5}
                      r={3}
                    />
                  ))}
              </g>
            );
          } else {
            // Horizontal orientation
            const xMin = valueScale(d.min);
            const xMax = valueScale(d.max);
            const xQ1 = valueScale(d.q1);
            const xQ3 = valueScale(d.q3);
            const xMedian = valueScale(d.median);
            const boxLeft = Math.min(xQ1, xQ3);
            const boxRight = Math.max(xQ1, xQ3);
            const boxWidth = Math.max(1, boxRight - boxLeft);
            const yTop = bandMid - boxHalfWidth;

            return (
              <g
                key={d.label}
                style={{ opacity, filter, cursor: "crosshair", transition: "opacity 0.15s ease, filter 0.15s ease" }}
                onMouseEnter={() => setHoveredLabel(d.label)}
                onMouseLeave={() => setHoveredLabel(null)}
              >
                {/* Whisker line min to max */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={xMin}
                  x2={xMax}
                  y1={bandMid}
                  y2={bandMid}
                />
                {/* Whisker cap at min */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={xMin}
                  x2={xMin}
                  y1={bandMid - capHalfWidth}
                  y2={bandMid + capHalfWidth}
                />
                {/* Whisker cap at max */}
                <line
                  stroke={color}
                  strokeWidth={1.5}
                  x1={xMax}
                  x2={xMax}
                  y1={bandMid - capHalfWidth}
                  y2={bandMid + capHalfWidth}
                />
                {/* Box body */}
                <motion.rect
                  animate={{ width: boxWidth, x: boxLeft }}
                  fill={color}
                  fillOpacity={0.7}
                  height={boxHalfWidth * 2}
                  initial={{ width: 0, x: xMedian }}
                  rx={3}
                  stroke={color}
                  strokeOpacity={1}
                  strokeWidth={1.5}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.85, 0, 0.15, 1] }}
                  width={boxWidth}
                  x={boxLeft}
                  y={yTop}
                />
                {/* Median line */}
                <line
                  pointerEvents="none"
                  stroke="var(--chart-overlay)"
                  strokeWidth={2}
                  x1={xMedian}
                  x2={xMedian}
                  y1={yTop}
                  y2={yTop + boxHalfWidth * 2}
                />
                {/* Outlier dots */}
                {showOutliers &&
                  (d.outliers ?? []).map((outlier, oi) => (
                    <circle
                      key={`outlier-${oi}`}
                      cx={valueScale(outlier)}
                      cy={bandMid}
                      fill={color}
                      fillOpacity={0.5}
                      r={3}
                    />
                  ))}
              </g>
            );
          }
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
        {orientation === "vertical"
          ? labels.map((label) => {
              const bandPos = bandScale(label) ?? 0;
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
            })
          : labels.map((label) => {
              const bandPos = bandScale(label) ?? 0;
              const yMid = bandPos + bandwidth / 2;
              return (
                <text
                  key={`ylabel-${label}`}
                  dominantBaseline="middle"
                  fill="var(--chart-overlay)"
                  fontSize={11}
                  textAnchor="end"
                  x={-8}
                  y={yMid}
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

export function BoxPlotChart({
  data,
  aspectRatio = "2 / 1",
  margin: marginProp,
  colorRange,
  orientation = "vertical",
  showOutliers = true,
  showMean = false,
  boxWidth = 0.5,
  className,
}: BoxPlotChartProps) {
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
        <BoxPlotChartCore
          boxWidthFraction={boxWidth}
          colors={colors}
          data={data}
          height={height}
          margin={margin}
          orientation={orientation}
          showMean={showMean}
          showOutliers={showOutliers}
          width={width}
        />
      )}
    </div>
  );
}

BoxPlotChart.displayName = "BoxPlotChart";

export default BoxPlotChart;
