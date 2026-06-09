import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import {
  type RadialBarContextValue,
  type RadialBarDataItem,
  RadialBarProvider,
} from "./radial-bar-context";

export interface RadialBarChartProps {
  data: RadialBarDataItem[];
  /** Fixed pixel size. If omitted, chart fills parent container. */
  size?: number;
  /** Inner empty-center radius in px. Default: 40 */
  innerRadius?: number;
  /** Outer maximum bar radius in px. Computed from size if not provided. */
  outerRadius?: number;
  /** Gap between bars in radians. Default: 0.05 */
  padAngle?: number;
  /** Starting angle in radians. Default: -π/2 (top) */
  startAngle?: number;
  children: ReactNode;
  className?: string;
}

interface RadialBarChartInnerProps {
  width: number;
  height: number;
  data: RadialBarDataItem[];
  innerRadius: number;
  outerRadius?: number;
  padAngle: number;
  startAngle: number;
  children: ReactNode;
}

function RadialBarChartInner({
  width,
  height,
  data,
  innerRadius,
  outerRadius: outerRadiusProp,
  padAngle,
  startAngle,
  children,
}: RadialBarChartInnerProps) {
  const size = Math.min(width, height);
  if (size < 10) return null;

  return (
    <RadialBarChartCore
      data={data}
      height={height}
      innerRadius={innerRadius}
      outerRadiusProp={outerRadiusProp}
      padAngle={padAngle}
      startAngle={startAngle}
      width={width}
    >
      {children}
    </RadialBarChartCore>
  );
}

interface RadialBarChartCoreProps extends RadialBarChartInnerProps {
  outerRadiusProp?: number;
}

function RadialBarChartCore({
  width,
  height,
  data,
  innerRadius,
  outerRadiusProp,
  padAngle,
  startAngle,
  children,
}: RadialBarChartCoreProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<
    number | null
  >(null);
  const [animationKey] = useState(0);

  const setHoveredIndex = useCallback(
    (index: number | null) => setInternalHoveredIndex(index),
    []
  );

  const size = Math.min(width, height);
  const center = size / 2;
  const padding = 12;
  const outerRadius = outerRadiusProp ?? center - padding;

  const n = data.length;
  // Each bar occupies (angleStep + padAngle) radians; solve for angleStep:
  // n * angleStep + n * padAngle = 2π  →  angleStep = (2π - n * padAngle) / n
  const angleStep = n > 0 ? (2 * Math.PI - n * padAngle) / n : 2 * Math.PI;

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  const contextValue: RadialBarContextValue = useMemo(
    () => ({
      data,
      maxValue,
      innerRadius,
      outerRadius,
      angleStep,
      padAngle,
      startAngle,
      animationKey,
      hoveredIndex: internalHoveredIndex,
      setHoveredIndex,
    }),
    [
      data,
      maxValue,
      innerRadius,
      outerRadius,
      angleStep,
      padAngle,
      startAngle,
      animationKey,
      internalHoveredIndex,
      setHoveredIndex,
    ]
  );

  return (
    <RadialBarProvider value={contextValue}>
      <svg
        aria-hidden="true"
        height={size}
        style={{ contain: "layout style paint" }}
        width={size}
      >
        <Group left={center} top={center}>
          {children}
        </Group>
      </svg>
    </RadialBarProvider>
  );
}

export function RadialBarChart({
  data,
  size: fixedSize,
  innerRadius = 40,
  outerRadius,
  padAngle = 0.05,
  startAngle = -Math.PI / 2,
  children,
  className,
}: RadialBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (fixedSize) {
    return (
      <div
        className={cn("relative flex items-center justify-center", className)}
        ref={containerRef}
        style={{ width: fixedSize, height: fixedSize }}
      >
        <RadialBarChartInner
          data={data}
          height={fixedSize}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          padAngle={padAngle}
          startAngle={startAngle}
          width={fixedSize}
        >
          {children}
        </RadialBarChartInner>
      </div>
    );
  }

  return (
    <div
      className={cn("relative aspect-square w-full", className)}
      ref={containerRef}
    >
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <RadialBarChartInner
            data={data}
            height={height}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            padAngle={padAngle}
            startAngle={startAngle}
            width={width}
          >
            {children}
          </RadialBarChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export default RadialBarChart;
