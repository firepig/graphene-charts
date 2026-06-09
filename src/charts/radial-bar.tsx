import { arc as arcGenerator } from "@visx/shape";
import { motion, useTransform } from "motion/react";
import { memo, useCallback } from "react";
import { useRadialBarHover, useRadialBarStable } from "./radial-bar-context";
import { useEnterComplete } from "./use-enter-complete";
import { useMountProgress } from "./use-mount-progress";

// Default color palette matching chart CSS vars
const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function generateArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  if (outerRadius <= innerRadius) return "";
  const generator = arcGenerator<unknown>({
    innerRadius,
    outerRadius,
    cornerRadius: 3,
  });
  return generator({ startAngle, endAngle } as unknown as null) ?? "";
}

/**
 * Compute the outward translation vector for an arc slot's midpoint angle.
 * visx/d3 arc convention: 0 = top (12 o'clock), clockwise positive.
 */
function getRadialOffset(
  slotStartAngle: number,
  angleStep: number,
  distance: number
): { x: number; y: number } {
  const midAngle = slotStartAngle + angleStep / 2;
  return {
    x: Math.sin(midAngle) * distance,
    y: -Math.cos(midAngle) * distance,
  };
}

export interface RadialBarProps {
  index: number;
  /** Optional color override — falls back to data item color or palette */
  color?: string;
}

export const RadialBar = memo(function RadialBar({
  index,
  color: colorProp,
}: RadialBarProps) {
  const {
    data,
    maxValue,
    innerRadius,
    outerRadius,
    angleStep,
    padAngle,
    startAngle: chartStartAngle,
    animationKey,
  } = useRadialBarStable();
  const { hoveredIndex, setHoveredIndex } = useRadialBarHover();

  const animationDelay = 0.05 + index * 0.07;
  const mountProgress = useMountProgress(
    undefined,
    animationDelay,
    `${animationKey}-radialbar-${index}`
  );
  const enterComplete = useEnterComplete(mountProgress);

  const item = data[index];
  if (!item) return null;

  // Slot start angle for this bar index
  const slotStartAngle =
    chartStartAngle + index * (angleStep + padAngle);
  const slotEndAngle = slotStartAngle + angleStep;

  // Radial extent: bar length proportional to value/maxValue
  const barOuterRadius =
    innerRadius + (item.value / maxValue) * (outerRadius - innerRadius);

  const color =
    colorProp ?? item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? "var(--chart-1)";

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;

  const hoverOffset = getRadialOffset(slotStartAngle, angleStep, 6);

  // Animated path: arc sweeps from slotStartAngle to slotEndAngle, but radial
  // extent grows from innerRadius → barOuterRadius as mountProgress goes 0→1.
  const animatedPath = useTransform(mountProgress, (v) => {
    const currentOuterRadius = innerRadius + (barOuterRadius - innerRadius) * v;
    return generateArcPath(innerRadius, currentOuterRadius, slotStartAngle, slotEndAngle);
  });

  const staticPath = generateArcPath(
    innerRadius,
    barOuterRadius,
    slotStartAngle,
    slotEndAngle
  );

  const handleMouseEnter = useCallback(
    () => setHoveredIndex(index),
    [index, setHoveredIndex]
  );
  const handleMouseLeave = useCallback(
    () => setHoveredIndex(null),
    [setHoveredIndex]
  );

  const glowFilter = `drop-shadow(0 0 10px ${color})`;
  const noGlowFilter = `drop-shadow(0 0 0px ${color})`;

  if (enterComplete) {
    return (
      <g style={{ cursor: "pointer" }}>
        {/* Invisible hitbox */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG arc used as hover hitbox */}
        <path
          d={staticPath}
          fill="transparent"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {/* Visible bar */}
        <motion.path
          animate={{
            opacity: isFaded ? 0.35 : 1,
            x: isHovered ? hoverOffset.x : 0,
            y: isHovered ? hoverOffset.y : 0,
            filter: isHovered ? glowFilter : noGlowFilter,
          }}
          d={staticPath}
          fill={color}
          pointerEvents="none"
          transition={{
            opacity: { duration: 0.15 },
            filter: { duration: 0.25 },
            x: { type: "spring", stiffness: 400, damping: 25 },
            y: { type: "spring", stiffness: 400, damping: 25 },
          }}
        />
      </g>
    );
  }

  return (
    <g style={{ cursor: "pointer" }}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG arc used as hover hitbox */}
      <path
        d={staticPath}
        fill="transparent"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <motion.path
        animate={{
          opacity: isFaded ? 0.35 : 1,
          x: isHovered ? hoverOffset.x : 0,
          y: isHovered ? hoverOffset.y : 0,
          filter: isHovered ? glowFilter : noGlowFilter,
        }}
        d={animatedPath}
        fill={color}
        key={`radialbar-${animationKey}-${index}`}
        pointerEvents="none"
        transition={{
          opacity: { duration: 0.15 },
          filter: { duration: 0.25 },
          x: { type: "spring", stiffness: 400, damping: 25 },
          y: { type: "spring", stiffness: 400, damping: 25 },
        }}
      />
    </g>
  );
});

RadialBar.displayName = "RadialBar";

export default RadialBar;
