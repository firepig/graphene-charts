import { scaleLinear, scaleSqrt } from "@visx/scale";
import { Group } from "@visx/group";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BubbleDatum {
  x: number;
  y: number;
  size: number;
  label?: string;
  color?: string;
}

export interface BubbleChartProps {
  data: BubbleDatum[] | BubbleDatum[][];
  aspectRatio?: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  sizeRange?: [number, number];
  colorRange?: string[];
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xLabel?: string;
  yLabel?: string;
  fillOpacity?: number;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 50, left: 55 };
const DEFAULT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const DEFAULT_SIZE_RANGE: [number, number] = [4, 40];

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeSeries(data: BubbleDatum[] | BubbleDatum[][]): BubbleDatum[][] {
  if (data.length === 0) return [];
  if (Array.isArray(data[0])) {
    return data as BubbleDatum[][];
  }
  return [data as BubbleDatum[]];
}

function formatNumber(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (Number.isInteger(v)) return `${v}`;
  return v.toFixed(2);
}

// ── Tooltip overlay ───────────────────────────────────────────────────────────

interface HoveredBubble {
  seriesIdx: number;
  dataIdx: number;
  cx: number;
  cy: number;
  datum: BubbleDatum;
}

// ── Inner chart ───────────────────────────────────────────────────────────────

interface BubbleChartCoreProps {
  series: BubbleDatum[][];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  sizeRange: [number, number];
  colors: string[];
  showGrid: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  xLabel?: string;
  yLabel?: string;
  fillOpacity: number;
}

function BubbleChartCore({
  series,
  width,
  height,
  margin,
  sizeRange,
  colors,
  showGrid,
  showXAxis,
  showYAxis,
  xLabel,
  yLabel,
  fillOpacity,
}: BubbleChartCoreProps) {
  const [hovered, setHovered] = useState<HoveredBubble | null>(null);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (innerWidth < 10 || innerHeight < 10) return null;

  const allData = series.flat();

  const { xMin, xMax, yMin, yMax, sizeMax } = useMemo(() => {
    if (allData.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1, sizeMax: 1 };
    }
    const xs = allData.map((d) => d.x);
    const ys = allData.map((d) => d.y);
    const sizes = allData.map((d) => d.size);
    const xExt = [Math.min(...xs), Math.max(...xs)];
    const yExt = [Math.min(...ys), Math.max(...ys)];
    const xRange = xExt[1] - xExt[0] || 1;
    const yRange = yExt[1] - yExt[0] || 1;
    return {
      xMin: xExt[0] - xRange * 0.05,
      xMax: xExt[1] + xRange * 0.05,
      yMin: yExt[0] - yRange * 0.05,
      yMax: yExt[1] + yRange * 0.05,
      sizeMax: Math.max(...sizes, 1),
    };
  }, [allData]);

  const xScale = scaleLinear({ domain: [xMin, xMax], range: [0, innerWidth], nice: true });
  const yScale = scaleLinear({ domain: [yMin, yMax], range: [innerHeight, 0], nice: true });
  const sizeScale = scaleSqrt({ domain: [0, sizeMax], range: sizeRange });

  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  // Flatten for global index-based stagger
  let globalIdx = 0;
  const renderedBubbles: {
    key: string;
    cx: number;
    cy: number;
    r: number;
    fill: string;
    stroke: string;
    staggerIdx: number;
    seriesIdx: number;
    dataIdx: number;
    datum: BubbleDatum;
  }[] = [];

  for (let si = 0; si < series.length; si++) {
    const s = series[si];
    const seriesColor = colors[si % colors.length] ?? colors[0];
    for (let di = 0; di < s.length; di++) {
      const d = s[di];
      const fill = d.color ?? seriesColor;
      renderedBubbles.push({
        key: `b-${si}-${di}`,
        cx: xScale(d.x),
        cy: yScale(d.y),
        r: sizeScale(d.size),
        fill,
        stroke: fill,
        staggerIdx: globalIdx,
        seriesIdx: si,
        dataIdx: di,
        datum: d,
      });
      globalIdx++;
    }
  }

  // Sort by size descending so smaller bubbles are on top
  renderedBubbles.sort((a, b) => b.r - a.r);

  return (
    <svg
      aria-hidden="true"
      height={height}
      style={{ contain: "layout style paint", display: "block", overflow: "visible" }}
      width={width}
    >
      <Group left={margin.left} top={margin.top}>
        {/* ── Grid lines ── */}
        {showGrid && (
          <>
            {yTicks.map((tick) => (
              <line
                key={`yg-${tick}`}
                stroke="var(--chart-grid)"
                strokeWidth={1}
                x1={0}
                x2={innerWidth}
                y1={yScale(tick)}
                y2={yScale(tick)}
              />
            ))}
            {xTicks.map((tick) => (
              <line
                key={`xg-${tick}`}
                stroke="var(--chart-grid)"
                strokeWidth={1}
                x1={xScale(tick)}
                x2={xScale(tick)}
                y1={0}
                y2={innerHeight}
              />
            ))}
          </>
        )}

        {/* ── Axis lines ── */}
        {showYAxis && (
          <line
            stroke="var(--chart-axis)"
            strokeWidth={1}
            x1={0}
            x2={0}
            y1={0}
            y2={innerHeight}
          />
        )}
        {showXAxis && (
          <line
            stroke="var(--chart-axis)"
            strokeWidth={1}
            x1={0}
            x2={innerWidth}
            y1={innerHeight}
            y2={innerHeight}
          />
        )}

        {/* ── X-axis ticks + labels ── */}
        {showXAxis &&
          xTicks.map((tick) => {
            const tx = xScale(tick);
            return (
              <g key={`xt-${tick}`}>
                <line
                  stroke="var(--chart-axis)"
                  strokeWidth={0.5}
                  x1={tx}
                  x2={tx}
                  y1={innerHeight}
                  y2={innerHeight + 4}
                />
                <text
                  dominantBaseline="hanging"
                  fill="var(--chart-label)"
                  fontFamily={FONT}
                  fontSize={10}
                  textAnchor="middle"
                  x={tx}
                  y={innerHeight + 8}
                >
                  {formatNumber(tick)}
                </text>
              </g>
            );
          })}

        {/* ── Y-axis ticks + labels ── */}
        {showYAxis &&
          yTicks.map((tick) => {
            const ty = yScale(tick);
            return (
              <g key={`yt-${tick}`}>
                <line
                  stroke="var(--chart-axis)"
                  strokeWidth={0.5}
                  x1={-4}
                  x2={0}
                  y1={ty}
                  y2={ty}
                />
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-label)"
                  fontFamily={FONT}
                  fontSize={10}
                  textAnchor="end"
                  x={-8}
                  y={ty}
                >
                  {formatNumber(tick)}
                </text>
              </g>
            );
          })}

        {/* ── Axis labels ── */}
        {xLabel && (
          <text
            dominantBaseline="hanging"
            fill="var(--chart-label)"
            fontFamily={FONT}
            fontSize={11}
            textAnchor="middle"
            x={innerWidth / 2}
            y={innerHeight + 32}
          >
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text
            dominantBaseline="auto"
            fill="var(--chart-label)"
            fontFamily={FONT}
            fontSize={11}
            textAnchor="middle"
            transform={`rotate(-90)`}
            x={-innerHeight / 2}
            y={-40}
          >
            {yLabel}
          </text>
        )}

        {/* ── Bubbles ── */}
        {renderedBubbles.map((b) => (
          <motion.circle
            key={b.key}
            animate={{ r: b.r, opacity: 1 }}
            cx={b.cx}
            cy={b.cy}
            fill={b.fill}
            fillOpacity={fillOpacity}
            initial={{ r: 0, opacity: 0 }}
            onMouseEnter={() =>
              setHovered({
                seriesIdx: b.seriesIdx,
                dataIdx: b.dataIdx,
                cx: b.cx,
                cy: b.cy,
                datum: b.datum,
              })
            }
            onMouseLeave={() => setHovered(null)}
            r={b.r}
            stroke={b.stroke}
            strokeOpacity={0.6}
            strokeWidth={1}
            style={{ cursor: "default" }}
            transition={{
              type: "tween",
              duration: 0.4,
              delay: b.staggerIdx * 0.03,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}

        {/* ── Tooltip overlay ── */}
        {hovered && (
          <g
            pointerEvents="none"
            transform={`translate(${hovered.cx + 10}, ${hovered.cy - 10})`}
          >
            {/* Background pill */}
            <rect
              fill="rgba(13,17,23,0.92)"
              height={52}
              rx={6}
              stroke="var(--chart-crosshair)"
              strokeWidth={1}
              width={130}
              x={0}
              y={-26}
            />
            {hovered.datum.label ? (
              <>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-tooltip-foreground)"
                  fontFamily={FONT}
                  fontSize={11}
                  fontWeight={600}
                  x={8}
                  y={-12}
                >
                  {hovered.datum.label}
                </text>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-label)"
                  fontFamily={FONT}
                  fontSize={10}
                  x={8}
                  y={4}
                >
                  {`x: ${formatNumber(hovered.datum.x)}, y: ${formatNumber(hovered.datum.y)}`}
                </text>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-label)"
                  fontFamily={FONT}
                  fontSize={10}
                  x={8}
                  y={18}
                >
                  {`size: ${formatNumber(hovered.datum.size)}`}
                </text>
              </>
            ) : (
              <>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-tooltip-foreground)"
                  fontFamily={FONT}
                  fontSize={10}
                  x={8}
                  y={-12}
                >
                  {`x: ${formatNumber(hovered.datum.x)}`}
                </text>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-tooltip-foreground)"
                  fontFamily={FONT}
                  fontSize={10}
                  x={8}
                  y={4}
                >
                  {`y: ${formatNumber(hovered.datum.y)}`}
                </text>
                <text
                  dominantBaseline="middle"
                  fill="var(--chart-label)"
                  fontFamily={FONT}
                  fontSize={10}
                  x={8}
                  y={18}
                >
                  {`size: ${formatNumber(hovered.datum.size)}`}
                </text>
              </>
            )}
          </g>
        )}
      </Group>
    </svg>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function BubbleChart({
  data,
  aspectRatio = "3 / 2",
  margin = DEFAULT_MARGIN,
  sizeRange = DEFAULT_SIZE_RANGE,
  colorRange = DEFAULT_COLORS,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  xLabel,
  yLabel,
  fillOpacity = 0.7,
  className,
}: BubbleChartProps) {
  const [ref, { width, height }] = useMeasure();

  const series = useMemo(() => normalizeSeries(data), [data]);

  return (
    <div
      className={cn("relative w-full select-none", className)}
      ref={ref}
      style={{ aspectRatio, background: "var(--chart-surface)" }}
    >
      {width > 0 && height > 0 && (
        <BubbleChartCore
          colors={colorRange}
          fillOpacity={fillOpacity}
          height={height}
          margin={margin}
          series={series}
          showGrid={showGrid}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          sizeRange={sizeRange}
          width={width}
          xLabel={xLabel}
          yLabel={yLabel}
        />
      )}
    </div>
  );
}

export default BubbleChart;
