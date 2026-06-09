import { interpolateRgb } from "d3-interpolate";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export interface HeatmapCalendarProps {
  data: { date: string | Date; value: number }[];
  startDate?: Date;
  endDate?: Date;
  /** Cell color when no data exists. Default: "#1e2535" */
  colorEmpty?: string;
  /** Low-value color. Default: "rgba(16,185,129,0.2)" */
  colorFrom?: string;
  /** High-value color. Default: "#10b981" */
  colorTo?: string;
  /** Pixel size of each cell. Default: 13 */
  cellSize?: number;
  /** Gap between cells in px. Default: 2 */
  cellGap?: number;
  className?: string;
  /** Show abbreviated month labels above grid. Default: true */
  showMonthLabels?: boolean;
  /** Show Mon/Wed/Fri day labels on the left. Default: true */
  showDayLabels?: boolean;
  /** Show native browser title tooltip on hover. Default: true */
  showTooltip?: boolean;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

const LABEL_FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
const LABEL_FONT_SIZE = 10;

/** Return midnight UTC for a given Date */
function toMidnightUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Return the most-recent Sunday on or before `d` (UTC) */
function startOfWeekUTC(d: Date): Date {
  const day = d.getUTCDay(); // 0=Sun
  const ms = d.getTime() - day * 86400000;
  return new Date(ms);
}

/** Add `n` days (UTC) */
function addDaysUTC(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

/** Format a Date as "MMM D, YYYY" */
function formatDate(d: Date): string {
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function HeatmapCalendar({
  data,
  startDate: startDateProp,
  endDate: endDateProp,
  colorEmpty = "var(--chart-border)",
  colorFrom = "var(--chart-grid)",
  colorTo = "var(--chart-3)",
  cellSize = 13,
  cellGap = 2,
  className,
  showMonthLabels = true,
  showDayLabels = true,
  showTooltip = true,
}: HeatmapCalendarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const { weeks, minVal, maxVal, valueMap } = useMemo(() => {
    // Parse all data points into a map keyed by ISO date string "YYYY-MM-DD"
    const valueMap = new Map<string, number>();
    for (const item of data) {
      const d = toMidnightUTC(item.date instanceof Date ? item.date : new Date(item.date));
      const key = d.toISOString().slice(0, 10);
      valueMap.set(key, (valueMap.get(key) ?? 0) + item.value);
    }

    // Determine date range
    const allValues = [...valueMap.values()];
    const minVal = allValues.length ? Math.min(...allValues) : 0;
    const maxVal = allValues.length ? Math.max(...allValues) : 1;

    // Resolve endDate: most recent data point, or today
    let endDate: Date;
    if (endDateProp) {
      endDate = toMidnightUTC(endDateProp);
    } else if (valueMap.size > 0) {
      const latestKey = [...valueMap.keys()].sort().at(-1)!;
      endDate = new Date(latestKey + "T00:00:00Z");
    } else {
      endDate = toMidnightUTC(new Date());
    }

    // Resolve startDate: 1 year ago from endDate
    let startDate: Date;
    if (startDateProp) {
      startDate = toMidnightUTC(startDateProp);
    } else {
      startDate = new Date(Date.UTC(endDate.getUTCFullYear() - 1, endDate.getUTCMonth(), endDate.getUTCDate() + 1));
    }

    // Snap start to the Sunday of its week
    const gridStart = startOfWeekUTC(startDate);
    // Snap end to the Saturday of its week
    const endDayOfWeek = endDate.getUTCDay();
    const gridEnd = addDaysUTC(endDate, 6 - endDayOfWeek);

    // Build week columns
    const weeks: { weekStart: Date; days: (Date | null)[] }[] = [];
    let cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const weekStart = new Date(cursor);
      const days: (Date | null)[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const day = addDaysUTC(weekStart, dow);
        // Only include days within [startDate, endDate]
        if (day >= startDate && day <= endDate) {
          days.push(day);
        } else {
          days.push(null);
        }
      }
      weeks.push({ weekStart, days });
      cursor = addDaysUTC(cursor, 7);
    }

    return { weeks, minVal, maxVal, valueMap };
  }, [data, startDateProp, endDateProp]);

  const colorScale = useMemo(() => {
    const interpolator = interpolateRgb(colorFrom, colorTo);
    return (value: number): string => {
      if (maxVal === minVal) return interpolator(1);
      return interpolator((value - minVal) / (maxVal - minVal));
    };
  }, [colorFrom, colorTo, minVal, maxVal]);

  const step = cellSize + cellGap;
  const dayLabelWidth = showDayLabels ? 28 : 0;
  const monthLabelHeight = showMonthLabels ? 20 : 0;

  const totalWidth = dayLabelWidth + weeks.length * step;
  const totalHeight = monthLabelHeight + 7 * step;

  // Compute month label positions: first week of each month
  const monthLabels = useMemo(() => {
    const labels: { x: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      // Find the first non-null day in this week
      const firstDay = week.days.find((d) => d !== null);
      if (!firstDay) return;
      const month = firstDay.getUTCMonth();
      if (month !== lastMonth) {
        // Only label if we're not in the very last partial week to avoid overflow
        labels.push({ x: dayLabelWidth + wi * step, label: MONTH_NAMES[month] });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks, step, dayLabelWidth]);

  return (
    <div
      className={className}
      style={{ display: "inline-block", overflowX: "auto" }}
    >
      <svg
        aria-label="Heatmap calendar"
        height={totalHeight}
        style={{ display: "block" }}
        width={totalWidth}
      >
        {/* Month labels */}
        {showMonthLabels &&
          monthLabels.map(({ x, label }) => (
            <text
              dominantBaseline="hanging"
              fill="var(--chart-label)"
              fontFamily={LABEL_FONT}
              fontSize={LABEL_FONT_SIZE}
              key={`month-${label}-${x}`}
              x={x}
              y={0}
            >
              {label}
            </text>
          ))}

        {/* Day-of-week labels */}
        {showDayLabels &&
          Object.entries(DAY_LABELS).map(([dowStr, label]) => {
            const dow = Number(dowStr);
            return (
              <text
                dominantBaseline="middle"
                fill="var(--chart-label)"
                fontFamily={LABEL_FONT}
                fontSize={LABEL_FONT_SIZE}
                key={`dow-${dow}`}
                textAnchor="start"
                x={0}
                y={monthLabelHeight + dow * step + cellSize / 2}
              >
                {label}
              </text>
            );
          })}

        {/* Grid cells */}
        {weeks.map((week, wi) => {
          const weekX = dayLabelWidth + wi * step;
          return week.days.map((day, dow) => {
            if (!day) return null;
            const isoKey = day.toISOString().slice(0, 10);
            const value = valueMap.get(isoKey);
            const fill = value !== undefined ? colorScale(value) : colorEmpty;
            const cellKey = isoKey;
            const isHovered = hoveredKey === cellKey;
            const y = monthLabelHeight + dow * step;

            const tooltipText =
              showTooltip
                ? value !== undefined
                  ? `${formatDate(day)}: ${value}`
                  : formatDate(day)
                : undefined;

            return (
              <motion.rect
                animate={{ opacity: 1 }}
                fill={fill}
                height={cellSize}
                initial={{ opacity: 0 }}
                key={cellKey}
                onMouseEnter={() => setHoveredKey(cellKey)}
                onMouseLeave={() => setHoveredKey(null)}
                rx={2}
                ry={2}
                style={{
                  cursor: "default",
                  filter: isHovered ? "brightness(1.35)" : undefined,
                  transition: "filter 0.1s ease",
                }}
                transition={{ delay: wi * 0.015, duration: 0.3 }}
                width={cellSize}
                x={weekX}
                y={y}
              >
                {tooltipText && <title>{tooltipText}</title>}
              </motion.rect>
            );
          });
        })}
      </svg>
    </div>
  );
}

export default HeatmapCalendar;
