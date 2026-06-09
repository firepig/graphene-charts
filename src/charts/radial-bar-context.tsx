import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

export interface RadialBarDataItem {
  label: string;
  value: number;
  color?: string;
}

export interface RadialBarHoverContextValue {
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

export interface RadialBarStableContextValue {
  data: RadialBarDataItem[];
  maxValue: number;
  innerRadius: number;
  outerRadius: number;
  angleStep: number;
  padAngle: number;
  startAngle: number;
  animationKey: number;
}

export type RadialBarContextValue = RadialBarStableContextValue &
  RadialBarHoverContextValue;

const RadialBarStableContext =
  createContext<RadialBarStableContextValue | null>(null);
const RadialBarHoverContext =
  createContext<RadialBarHoverContextValue | null>(null);

export function RadialBarProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: RadialBarContextValue;
}) {
  const stable = useMemo<RadialBarStableContextValue>(
    () => ({
      data: value.data,
      maxValue: value.maxValue,
      innerRadius: value.innerRadius,
      outerRadius: value.outerRadius,
      angleStep: value.angleStep,
      padAngle: value.padAngle,
      startAngle: value.startAngle,
      animationKey: value.animationKey,
    }),
    [
      value.data,
      value.maxValue,
      value.innerRadius,
      value.outerRadius,
      value.angleStep,
      value.padAngle,
      value.startAngle,
      value.animationKey,
    ]
  );

  const hover = useMemo<RadialBarHoverContextValue>(
    () => ({
      hoveredIndex: value.hoveredIndex,
      setHoveredIndex: value.setHoveredIndex,
    }),
    [value.hoveredIndex, value.setHoveredIndex]
  );

  return (
    <RadialBarStableContext.Provider value={stable}>
      <RadialBarHoverContext.Provider value={hover}>
        {children}
      </RadialBarHoverContext.Provider>
    </RadialBarStableContext.Provider>
  );
}

export function useRadialBarStable(): RadialBarStableContextValue {
  const context = useContext(RadialBarStableContext);
  if (!context) {
    throw new Error(
      "useRadialBarStable must be used within a RadialBarProvider. " +
        "Make sure your component is wrapped in <RadialBarChart>."
    );
  }
  return context;
}

export function useRadialBarHover(): RadialBarHoverContextValue {
  const context = useContext(RadialBarHoverContext);
  if (!context) {
    throw new Error(
      "useRadialBarHover must be used within a RadialBarProvider. " +
        "Make sure your component is wrapped in <RadialBarChart>."
    );
  }
  return context;
}

export function useRadialBar(): RadialBarContextValue {
  return { ...useRadialBarStable(), ...useRadialBarHover() };
}
