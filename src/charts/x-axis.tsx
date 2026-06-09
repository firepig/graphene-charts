

import { motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { useChart, useChartStable } from "./chart-context";
import { shortDateFmt } from "./chart-formatters";

export interface XAxisProps {
  /** Number of ticks to show (including first and last). Default: 5. Used when `tickMode` is `"domain"`. */
  numTicks?: number;
  /**
   * `"domain"` — evenly spaced ticks across the time domain (default).
   * `"data"` — one label per data row at its x value (better with sparse or monthly bars).
   */
  tickMode?: "domain" | "data";
  /** Opacity of non-active labels when hovering. Default: 0.35 */
  fadedOpacity?: number;
}

interface XAxisLabelProps {
  label: string;
  x: number;
  isFaded: boolean;
}

function XAxisLabel({ label, x, isFaded }: XAxisLabelProps) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        bottom: 12,
        width: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <motion.span
        animate={{ opacity: isFaded ? 0.35 : 1 }}
        className={cn("whitespace-nowrap text-chart-label text-xs")}
        initial={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        {label}
      </motion.span>
    </div>
  );
}

export function XAxis(props: XAxisProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return <XAxisInner {...props} container={container} />;
}

const XAxisInner = memo(function XAxisInner({
  numTicks = 5,
  tickMode = "domain",
  fadedOpacity = 0.35,
  container,
}: XAxisProps & { container: HTMLDivElement }) {
  const { xScale, margin, tooltipData, data, xAccessor, dateLabels } =
    useChart();

  const labelsToShow = useMemo(() => {
    if (tickMode === "data") {
      return data.map((d, i) => ({
        date: xAccessor(d),
        x: (xScale(xAccessor(d)) ?? 0) + margin.left,
        label: dateLabels[i] ?? shortDateFmt.format(xAccessor(d)),
      }));
    }

    const domain = xScale.domain();
    const startDate = domain[0];
    const endDate = domain[1];

    if (!(startDate && endDate)) {
      return [];
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const timeRange = endTime - startTime;
    const tickCount = Math.max(2, numTicks);
    const dates: Date[] = [];

    for (let i = 0; i < tickCount; i++) {
      const t = i / (tickCount - 1);
      dates.push(new Date(startTime + t * timeRange));
    }

    return dates.map((date) => ({
      date,
      x: (xScale(date) ?? 0) + margin.left,
      label: shortDateFmt.format(date),
    }));
  }, [tickMode, data, xAccessor, xScale, margin.left, dateLabels, numTicks]);

  const crosshairX = tooltipData ? tooltipData.x + margin.left : null;

  // Find the index of the tick closest to the crosshair
  const activeIndex = useMemo(() => {
    if (crosshairX === null || labelsToShow.length === 0) return null;
    let closest = 0;
    let minDist = Math.abs(labelsToShow[0]!.x - crosshairX);
    for (let i = 1; i < labelsToShow.length; i++) {
      const dist = Math.abs(labelsToShow[i]!.x - crosshairX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }, [crosshairX, labelsToShow]);

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {labelsToShow.map((item, i) => (
        <XAxisLabel
          key={`${item.date.getTime()}-${item.x}`}
          label={item.label}
          x={item.x}
          isFaded={activeIndex !== null && activeIndex !== i}
        />
      ))}
    </div>,
    container
  );
});

XAxis.displayName = "XAxis";

export default XAxis;
