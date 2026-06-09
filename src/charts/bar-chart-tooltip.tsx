

import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useChart, useChartStable } from "./chart-context";
import { TooltipBox } from "./tooltip/tooltip-box";
import { TooltipContent } from "./tooltip/tooltip-content";

export interface BarChartTooltipProps {
  /**
   * Format a raw value for display. Default: locale number format.
   * Useful for adding units, percentages, etc.
   */
  formatValue?: (value: number, dataKey: string) => string;
  /**
   * Override the tooltip title. Defaults to the hovered bar's category label.
   */
  title?: (categoryLabel: string) => string;
}

export const BarChartTooltip = memo(function BarChartTooltip({
  formatValue,
  title,
}: BarChartTooltipProps) {
  const { containerRef } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) return null;

  return <BarChartTooltipInner container={container} formatValue={formatValue} title={title} />;
});

function BarChartTooltipInner({
  container,
  formatValue,
  title,
}: BarChartTooltipProps & { container: HTMLElement }) {
  const {
    tooltipData,
    lines,
    margin,
    width,
    height,
    innerHeight,
    barXAccessor,
  } = useChart();

  const visible = tooltipData != null;
  const categoryLabel = tooltipData && barXAccessor
    ? barXAccessor(tooltipData.point)
    : "";
  const tooltipTitle = title ? title(categoryLabel) : categoryLabel;

  // x: inner chart x → container space (add left margin)
  // y: vertically centered in the plot area
  const x = (tooltipData?.x ?? 0) + margin.left;
  const y = margin.top + innerHeight / 2;

  const rows = lines.map((line) => {
    const raw = tooltipData?.point[line.dataKey];
    const value = typeof raw === "number" ? raw : 0;
    return {
      color: line.stroke,
      label: line.dataKey,
      value: formatValue ? formatValue(value, line.dataKey) : value,
    };
  });

  return createPortal(
    <TooltipBox
      containerHeight={height}
      containerRef={{ current: container } as React.RefObject<HTMLDivElement>}
      containerWidth={width}
      visible={visible}
      x={x}
      y={y}
    >
      <TooltipContent rows={rows} title={tooltipTitle} />
    </TooltipBox>,
    container
  );
}

BarChartTooltip.displayName = "BarChartTooltip";
export default BarChartTooltip;
