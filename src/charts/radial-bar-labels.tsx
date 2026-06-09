import { useRadialBarStable } from "./radial-bar-context";

export interface RadialBarLabelsProps {
  /** Distance in px beyond outerRadius at which labels are placed. Default: 12 */
  offset?: number;
}

/**
 * Renders a text label for each data item outside the outerRadius of the chart.
 * Must be placed inside a <RadialBarChart>.
 */
export function RadialBarLabels({ offset = 12 }: RadialBarLabelsProps) {
  const { data, outerRadius, angleStep, padAngle, startAngle } =
    useRadialBarStable();

  return (
    <>
      {data.map((item, index) => {
        const slotStartAngle = startAngle + index * (angleStep + padAngle);
        const midAngle = slotStartAngle + angleStep / 2;

        // visx/d3 convention: 0 = top (12 o'clock), clockwise
        const labelRadius = outerRadius + offset;
        const x = Math.sin(midAngle) * labelRadius;
        const y = -Math.cos(midAngle) * labelRadius;

        // Anchor left/right depending on which half of the circle
        const textAnchor =
          Math.abs(midAngle % (2 * Math.PI)) < 0.05 ||
          Math.abs((midAngle % (2 * Math.PI)) - Math.PI) < 0.05
            ? "middle"
            : Math.sin(midAngle) > 0
              ? "start"
              : "end";

        return (
          <text
            dominantBaseline="central"
            fill="var(--chart-foreground, currentColor)"
            fontSize={12}
            key={item.label}
            opacity={0.8}
            style={{ userSelect: "none" }}
            textAnchor={textAnchor}
            x={x}
            y={y}
          >
            {item.label}
          </text>
        );
      })}
    </>
  );
}

RadialBarLabels.displayName = "RadialBarLabels";

export default RadialBarLabels;
