

import { motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { useChart, useChartStable } from "./chart-context";

export interface BarXAxisProps {
  /** Whether to show all labels or skip some for dense data. Default: false */
  showAllLabels?: boolean;
  /** Maximum number of labels to show. Default: 12 */
  maxLabels?: number;
  /** Opacity of non-hovered labels when a bar is active. Default: 0.35 */
  fadedOpacity?: number;
}

interface BarXAxisLabelProps {
  label: string;
  x: number;
  isFaded: boolean;
}

function BarXAxisLabel({ label, x, isFaded }: BarXAxisLabelProps) {
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

interface BarYAxisLabelProps {
  label: string;
  y: number;
  isFaded: boolean;
}

function BarYAxisLabel({ label, y, isFaded }: BarYAxisLabelProps) {
  return (
    <div
      className="absolute"
      style={{
        top: y,
        left: 0,
        height: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 8,
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

export function BarXAxis(props: BarXAxisProps) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  if (!barScale) {
    return null;
  }

  return <BarXAxisInner {...props} container={container} />;
}

const BarXAxisInner = memo(function BarXAxisInner({
  showAllLabels = false,
  maxLabels = 12,
  fadedOpacity = 0.35,
  container,
}: BarXAxisProps & { container: HTMLDivElement }) {
  const { margin, tooltipData, barScale, bandWidth, barXAccessor, data, orientation } = useChart();

  const isHorizontal = orientation === "horizontal";
  const hoveredIndex = tooltipData?.index ?? null;

  const labelsToShow = useMemo(() => {
    if (!(barScale && bandWidth && barXAccessor)) {
      return [];
    }

    if (isHorizontal) {
      // For horizontal bars, labels go on the left side (y positions)
      const allLabels = data.map((d, i) => {
        const label = barXAccessor(d);
        const bandY = barScale(label) ?? 0;
        const y = bandY + bandWidth / 2 + margin.top;
        return { label, y, index: i };
      });

      if (showAllLabels || allLabels.length <= maxLabels) {
        return allLabels;
      }

      const step = Math.ceil(allLabels.length / maxLabels);
      return allLabels.filter((_, i) => i % step === 0);
    }

    // Vertical bars (default): labels along the bottom x-axis
    const allLabels = data.map((d, i) => {
      const label = barXAccessor(d);
      const bandX = barScale(label) ?? 0;
      const x = bandX + bandWidth / 2 + margin.left;
      return { label, x, index: i };
    });

    if (showAllLabels || allLabels.length <= maxLabels) {
      return allLabels;
    }

    const step = Math.ceil(allLabels.length / maxLabels);
    return allLabels.filter((_, i) => i % step === 0);
  }, [barScale, bandWidth, barXAccessor, data, margin.left, margin.top, isHorizontal, showAllLabels, maxLabels]);

  if (isHorizontal) {
    return createPortal(
      <div className="pointer-events-none absolute inset-0" style={{ width: margin.left }}>
        {(labelsToShow as { label: string; y: number; index: number }[]).map((item) => (
          <BarYAxisLabel
            key={`${item.label}-${item.y}`}
            label={item.label}
            y={item.y}
            isFaded={hoveredIndex !== null && hoveredIndex !== item.index}
          />
        ))}
      </div>,
      container
    );
  }

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {(labelsToShow as { label: string; x: number; index: number }[]).map((item) => (
        <BarXAxisLabel
          key={`${item.label}-${item.x}-${item.index}`}
          label={item.label}
          x={item.x}
          isFaded={hoveredIndex !== null && hoveredIndex !== item.index}
        />
      ))}
    </div>,
    container
  );
});

BarXAxis.displayName = "BarXAxis";

export default BarXAxis;
