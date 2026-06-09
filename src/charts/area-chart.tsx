

import { ParentSize } from "@visx/responsive";
import type { Transition } from "motion/react";
import {
  Children,
  isValidElement,
  type ReactNode,
  useMemo,
  useRef,
} from "react";
import { cn } from "../lib/utils";
import { Area, type AreaProps } from "./area";
import type { LineConfig, Margin } from "./chart-context";
import { PatternArea } from "./pattern-area";
import { TimeSeriesChartInner } from "./time-series-chart-shell";

export interface AreaChartProps {
  /** Data array - each item should have a date field and numeric values */
  data: Record<string, unknown>[];
  /** Key in data for the x-axis (date). Default: "date" */
  xDataKey?: string;
  /** Chart margins */
  margin?: Partial<Margin>;
  /** Animation duration in milliseconds. Default: 1100 */
  animationDuration?: number;
  /** CSS easing for clip-reveal. Default: cubic-bezier(0.85, 0, 0.15, 1) */
  animationEasing?: string;
  /** Motion enter transition (spring or cubic-bezier tween). */
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers reveal replay when it changes. */
  revealSignature?: string;
  /** Aspect ratio as "width / height". Default: "2 / 1" */
  aspectRatio?: string;
  /** Additional class name for the container */
  className?: string;
  /**
   * Stacking mode for area series.
   * - `"normal"`: areas stack with raw values (default stacking behavior).
   * - `"percent"`: normalizes each row so all series sum to 100; y-axis shows 0–100.
   */
  stackMode?: "normal" | "percent";
  /** Child components (Area, Grid, ChartTooltip, etc.) */
  children: ReactNode;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 40, bottom: 40, left: 40 };

function extractAreaConfigs(children: ReactNode): LineConfig[] {
  const configs: LineConfig[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    const childType = child.type as {
      displayName?: string;
      name?: string;
    };
    const componentName =
      typeof child.type === "function"
        ? childType.displayName || childType.name || ""
        : "";

    const props = child.props as AreaProps | undefined;
    const isPatternArea =
      componentName === "PatternArea" || child.type === PatternArea;
    const isAreaComponent =
      componentName === "Area" ||
      child.type === Area ||
      (props &&
        typeof props.dataKey === "string" &&
        props.dataKey.length > 0 &&
        !isPatternArea);

    if (isAreaComponent && props?.dataKey) {
      configs.push({
        dataKey: props.dataKey,
        stroke: props.stroke || props.fill || "var(--chart-line-primary)",
        strokeWidth: props.strokeWidth || 2,
        yAxisId: props.yAxisId,
      });
    }
  });

  return configs;
}

interface ChartInnerProps {
  width: number;
  height: number;
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: Margin;
  animationDuration: number;
  animationEasing?: string;
  enterTransition?: Transition;
  revealSignature?: string;
  stackMode?: "normal" | "percent";
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * For each row in `data`, normalize the values of `dataKeys` so they sum to
 * 100. Non-numeric values and zero-sum rows are left as-is (zero or unchanged).
 */
function normalizeToPercent(
  data: Record<string, unknown>[],
  dataKeys: string[]
): Record<string, unknown>[] {
  return data.map((row) => {
    let total = 0;
    for (const key of dataKeys) {
      const v = row[key];
      if (typeof v === "number") {
        total += v;
      }
    }
    if (total === 0) {
      return row;
    }
    const normalized: Record<string, unknown> = { ...row };
    for (const key of dataKeys) {
      const v = row[key];
      if (typeof v === "number") {
        normalized[key] = (v / total) * 100;
      }
    }
    return normalized;
  });
}

function ChartInner({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing,
  enterTransition,
  revealSignature,
  stackMode,
  children,
  containerRef,
}: ChartInnerProps) {
  const lines = useMemo(() => extractAreaConfigs(children), [children]);

  const effectiveData = useMemo(() => {
    if (stackMode !== "percent") {
      return data;
    }
    const dataKeys = lines.map((l) => l.dataKey);
    return normalizeToPercent(data, dataKeys);
  }, [data, lines, stackMode]);

  // When stackMode === "percent" the y-domain is always [0, 100].
  const yScaleDomainMax = stackMode === "percent" ? 100 / 1.1 : undefined;

  return (
    <TimeSeriesChartInner
      animationDuration={animationDuration}
      animationEasing={animationEasing}
      clipPathId="chart-area-grow-clip"
      containerRef={containerRef}
      data={effectiveData}
      enterTransition={enterTransition}
      height={height}
      lines={lines}
      margin={margin}
      revealSignature={revealSignature}
      width={width}
      xDataKey={xDataKey}
      yScaleDomainMax={yScaleDomainMax}
    >
      {children}
    </TimeSeriesChartInner>
  );
}

export function AreaChart({
  data,
  xDataKey = "date",
  margin: marginProp,
  animationDuration = 1100,
  animationEasing,
  enterTransition,
  revealSignature,
  aspectRatio = "2 / 1",
  className = "",
  stackMode,
  children,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div
      className={cn("relative w-full", className)}
      ref={containerRef}
      style={{ aspectRatio, touchAction: "none", overflow: "hidden" }}
    >
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <ChartInner
            animationDuration={animationDuration}
            animationEasing={animationEasing}
            containerRef={containerRef}
            data={data}
            enterTransition={enterTransition}
            height={height}
            margin={margin}
            revealSignature={revealSignature}
            stackMode={stackMode}
            width={width}
            xDataKey={xDataKey}
          >
            {children}
          </ChartInner>
        )}
      </ParentSize>
    </div>
  );
}

export { Area, type AreaProps } from "./area";

export default AreaChart;
