

import type { scaleBand } from "@visx/scale";
import type { Transition } from "motion/react";
import { motion } from "motion/react";
import { memo, useId, useMemo } from "react";
import {
  chartCssVars,
  useChart,
  useChartStable,
  useYScale,
} from "./chart-context";
import { useChartLegendHover } from "./chart-legend-hover";
import { transitionWithDelay } from "./motion-utils";

type ScaleBand<Domain extends { toString(): string }> = ReturnType<
  typeof scaleBand<Domain>
>;

export type BarLineCap = "round" | "butt" | number;
export type BarAnimationType = "grow" | "fade";

export interface BarProps {
  /** Key in data to use for y values */
  dataKey: string;
  /** Y-scale group id for vertical bars (Recharts `yAxisId`). Default: `"left"`. */
  yAxisId?: string | number;
  /** Fill color for the bar. Can be a color, gradient url, or pattern url. Default: var(--chart-line-primary) */
  fill?: string;
  /** Color for tooltip dot. Use when fill is a gradient/pattern. Default: uses fill value */
  stroke?: string;
  /** Line cap style for bar ends: "round", "butt", or a number for custom radius. Default: "round" */
  lineCap?: BarLineCap;
  /** Whether to animate the bars. Default: true */
  animate?: boolean;
  /** Animation type: "grow" (height) or "fade" (opacity + blur). Default: "grow" */
  animationType?: BarAnimationType;
  /** Opacity when not hovered (when another bar is hovered). Default: 0.3 */
  fadedOpacity?: number;
  /** Stagger delay between bars in seconds. Auto-calculated if not provided. */
  staggerDelay?: number;
  /** Gap between stacked bars in pixels. Default: 0 */
  stackGap?: number;
  /** Gap between grouped bars in pixels. Default: 4 */
  groupGap?: number;
}

interface BarInnerProps extends BarProps {
  barScale: ScaleBand<string>;
  bandWidth: number;
  barXAccessor: (d: Record<string, unknown>) => string;
}

interface AnimatedBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rx: number;
  ry: number;
  index: number;
  isFaded: boolean;
  animationType: BarAnimationType;
  innerHeight: number;
  fadedOpacity: number;
  staggerDelay: number;
  enterTransition?: Transition;
  revealEpoch: number;
  isHorizontal: boolean;
  /** Pixel position of the zero baseline on the value axis */
  zeroPos: number;
  /** Whether the bar represents a negative value */
  isNegative: boolean;
}

function AnimatedBar({
  x,
  y,
  width,
  height,
  fill,
  rx,
  ry,
  index,
  isFaded,
  animationType,
  innerHeight,
  fadedOpacity,
  staggerDelay,
  enterTransition,
  revealEpoch,
  isHorizontal,
  zeroPos,
  isNegative,
}: AnimatedBarProps) {
  const enterAnim = transitionWithDelay(enterTransition, index * staggerDelay);

  if (animationType === "fade") {
    return (
      <motion.rect
        animate={{
          opacity: isFaded ? fadedOpacity : 1,
          filter: "blur(0px)",
        }}
        fill={fill}
        height={height}
        initial={{ opacity: 0, filter: "blur(2px)" }}
        key={`fade-${index}-${revealEpoch}`}
        rx={rx}
        ry={ry}
        transition={enterAnim}
        width={width}
        x={x}
        y={y}
      />
    );
  }

  // Grow animation starts from the zero baseline with zero size
  const initial = isHorizontal
    ? { width: 0, height, x: isNegative ? x + width : 0, y }
    : { width, height: 0, x, y: zeroPos };
  const target = isHorizontal
    ? { width, height, x: isNegative ? x : 0, y }
    : { width, height, x, y };

  return (
    <g
      opacity={isFaded ? fadedOpacity : 1}
      style={{ transition: "opacity 0.15s ease-in-out" }}
    >
      <motion.rect
        animate={target}
        fill={fill}
        initial={initial}
        key={`grow-${index}-${revealEpoch}`}
        rx={rx}
        ry={ry}
        transition={enterAnim}
      />
    </g>
  );
}

const BarInner = memo(function BarInner({
  dataKey,
  yAxisId,
  fill = chartCssVars.linePrimary,
  lineCap = "round",
  animate = true,
  animationType = "grow",
  fadedOpacity = 0.3,
  staggerDelay,
  stackGap = 0,
  groupGap = 4,
  barScale,
  bandWidth,
  barXAccessor,
}: BarInnerProps) {
  const {
    data,
    yScale: chartYScale,
    innerHeight,
    isLoaded,
    hoveredBarIndex,
    lines,
    orientation,
    stacked,
    stackMode,
    stackOffsets,
    animationDuration,
    enterTransition,
    revealEpoch = 0,
  } = useChart();

  // Calculate stagger delay automatically if not provided
  // Total animation duration is ~1200ms, with 40% for stagger spread and 60% for bar animation
  const totalAnimDuration = animationDuration || 1100;
  const staggerSpread = totalAnimDuration * 0.4; // 40% of time for stagger spread
  const calculatedStaggerDelay =
    staggerDelay ?? (data.length > 1 ? staggerSpread / 1000 / data.length : 0);
  const uniqueId = useId();

  const isHorizontal = orientation === "horizontal";

  // Find the index of this bar series among all bar series
  const { hoveredIndex: legendHoveredIndex } = useChartLegendHover();

  const seriesIndex = useMemo(() => {
    const idx = lines.findIndex((l) => l.dataKey === dataKey);
    return idx >= 0 ? idx : 0;
  }, [lines, dataKey]);

  const seriesConfig = lines[seriesIndex];
  const valueScale = useYScale(yAxisId ?? seriesConfig?.yAxisId);

  const isLegendDimmed =
    legendHoveredIndex !== null && legendHoveredIndex !== seriesIndex;

  const seriesCount = lines.length;
  const isLastSeries = seriesIndex === seriesCount - 1;

  // Calculate the width for each bar within a group (for non-stacked)
  const barWidth = useMemo(() => {
    if (!bandWidth || seriesCount === 0) {
      return 0;
    }
    if (stacked) {
      // Stacked bars use full band width
      return bandWidth;
    }
    // Leave a gap between grouped bars (controlled by groupGap prop)
    const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
    return (bandWidth - effectiveGroupGap * (seriesCount - 1)) / seriesCount;
  }, [bandWidth, seriesCount, stacked, groupGap]);

  // Calculate corner radius based on lineCap
  const cornerRadius = useMemo(() => {
    if (typeof lineCap === "number") {
      return lineCap;
    }
    if (lineCap === "round" && barWidth) {
      return Math.min(barWidth / 2, 8);
    }
    return 0;
  }, [lineCap, barWidth]);

  return (
    <g className={`bar-series-${uniqueId}`}>
      {data.map((d, i) => {
        const value = d[dataKey];
        if (typeof value !== "number") {
          return null;
        }

        const categoryValue = barXAccessor(d);
        const bandPos = barScale(categoryValue) ?? 0;

        let x: number;
        let y: number;
        let barHeight: number;
        let barW: number;

        const scale = isHorizontal ? chartYScale : valueScale;

        // Effective value: for percent mode with stacking, the offset map
        // already stores normalized values; the raw value is used to determine
        // sign and magnitude within that normalized space.
        let effectiveValue = value;
        if (stackMode === "percent" && stacked) {
          const pointMap = stackOffsets?.get(i);
          if (pointMap) {
            // Compute total for this data point to normalize
            let total = 0;
            for (const l of lines) {
              const v = d[l.dataKey];
              if (typeof v === "number") total += Math.abs(v);
            }
            if (total > 0) {
              effectiveValue = (value / total) * 100;
            }
          }
        }

        // Zero baseline pixel position
        const zeroPos = scale(0) ?? (isHorizontal ? 0 : innerHeight);
        const isNegative = effectiveValue < 0;

        if (isHorizontal) {
          // Horizontal bars: category on y-axis, value on x-axis
          const valuePos = scale(effectiveValue) ?? 0;
          barHeight = barWidth;

          if (stacked && stackOffsets) {
            const offset = stackOffsets.get(i)?.get(dataKey) ?? 0;
            const offsetPos = scale(offset) ?? 0;
            // Apply stack gap for horizontal: shift right and reduce width
            const gapOffset = seriesIndex * stackGap;
            if (isNegative) {
              // Negative: bar grows leftward from offset
              x = valuePos + gapOffset;
              barW = Math.max(0, offsetPos - valuePos - (isLastSeries ? 0 : stackGap));
            } else {
              x = offsetPos + gapOffset;
              barW = Math.max(0, valuePos - offsetPos - (isLastSeries ? 0 : stackGap));
            }
          } else {
            // Grouped horizontal bars
            if (isNegative) {
              // Negative bars grow leftward from zero
              x = valuePos;
              barW = Math.max(0, zeroPos - valuePos);
            } else {
              x = zeroPos;
              barW = Math.max(0, valuePos - zeroPos);
            }
          }
          y = stacked
            ? bandPos
            : bandPos +
              seriesIndex * (barWidth + (seriesCount > 1 ? groupGap : 0));
        } else {
          // Vertical bars: category on x-axis, value on y-axis
          const valuePos = scale(effectiveValue) ?? 0;
          barW = barWidth;

          if (stacked && stackOffsets) {
            const offset = stackOffsets.get(i)?.get(dataKey) ?? 0;
            const offsetY = scale(offset) ?? innerHeight;
            // Apply stack gap: shift up/down and reduce height
            const gapOffset = seriesIndex * stackGap;
            if (isNegative) {
              // Negative: bar grows downward from offset
              y = offsetY + gapOffset;
              barHeight = Math.max(0, valuePos - offsetY - (isLastSeries ? 0 : stackGap));
            } else {
              barHeight = Math.max(0, offsetY - valuePos - (isLastSeries ? 0 : stackGap));
              y = valuePos + gapOffset;
            }
            // Reduce height slightly for non-last bars to create visual gap
            if (!isLastSeries && stackGap > 0) {
              barHeight = Math.max(0, barHeight - stackGap);
            }
          } else {
            if (isNegative) {
              // Negative bar: starts at zero baseline, grows downward
              y = zeroPos;
              barHeight = Math.max(0, valuePos - zeroPos);
            } else {
              // Positive bar: starts at value, grows upward to zero baseline
              y = valuePos;
              barHeight = Math.max(0, zeroPos - valuePos);
            }
            // For grouped bars, offset x position
            const effectiveGroupGap = seriesCount > 1 ? groupGap : 0;
            x = bandPos + seriesIndex * (barWidth + effectiveGroupGap);
          }
          x = stacked
            ? bandPos
            : bandPos +
              seriesIndex * (barWidth + (seriesCount > 1 ? groupGap : 0));
        }

        const isFaded =
          (hoveredBarIndex !== null && hoveredBarIndex !== i) || isLegendDimmed;

        // Use categoryValue as key since it's the unique identifier from data
        const barKey = `bar-${dataKey}-${categoryValue}`;

        // Apply rounded corners:
        // - For non-stacked: always apply
        // - For stacked with gap: apply to all bars
        // - For stacked without gap: only apply to the last series
        const applyRounding = !stacked || stackGap > 0 || isLastSeries;
        const effectiveRx = applyRounding ? cornerRadius : 0;
        const effectiveRy = applyRounding ? cornerRadius : 0;

        if (animate && !isLoaded) {
          return (
            <AnimatedBar
              animationType={animationType}
              enterTransition={enterTransition}
              fadedOpacity={fadedOpacity}
              fill={fill}
              height={barHeight}
              index={i}
              innerHeight={innerHeight}
              isFaded={isFaded}
              isHorizontal={isHorizontal}
              isNegative={isNegative}
              key={barKey}
              revealEpoch={revealEpoch}
              rx={effectiveRx}
              ry={effectiveRy}
              staggerDelay={calculatedStaggerDelay}
              width={barW}
              x={x}
              y={y}
              zeroPos={zeroPos}
            />
          );
        }

        // Static bar after animation completes
        return (
          <rect
            fill={fill}
            height={barHeight}
            key={barKey}
            opacity={isFaded ? fadedOpacity : 1}
            rx={effectiveRx}
            ry={effectiveRy}
            style={{
              cursor: "default",
              transition: "opacity 0.15s ease-in-out",
            }}
            width={barW}
            x={x}
            y={y}
          />
        );
      })}
    </g>
  );
});

export function Bar(props: BarProps) {
  const { barScale, bandWidth, barXAccessor } = useChartStable();

  if (!(barScale && bandWidth && barXAccessor)) {
    console.warn("Bar component must be used within a BarChart");
    return null;
  }

  return (
    <BarInner
      {...props}
      bandWidth={bandWidth}
      barScale={barScale}
      barXAccessor={barXAccessor}
    />
  );
}

Bar.displayName = "Bar";

export default Bar;
