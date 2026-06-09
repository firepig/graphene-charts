// ── Sankey ───────────────────────────────────────────────────────────────────
export * from "./sankey";

// ── Time-series charts ───────────────────────────────────────────────────────
export { LineChart } from "./line-chart";
export type { LineChartProps } from "./line-chart";
export { Line } from "./line";
export type { LineProps } from "./line";

export { AreaChart } from "./area-chart";
export type { AreaChartProps } from "./area-chart";
export { Area } from "./area";
export type { AreaProps } from "./area";
export { AreaGradientDefs } from "./area-gradient-defs";
export { PatternArea } from "./pattern-area";
export type { PatternAreaProps } from "./pattern-area";

export { ComposedChart } from "./composed-chart";
export type { ComposedChartProps } from "./composed-chart";

// ── Bar chart ────────────────────────────────────────────────────────────────
export { BarChart } from "./bar-chart";
export type { BarChartProps } from "./bar-chart";
export { Bar } from "./bar";
export type { BarProps } from "./bar";
export { BarXAxis } from "./bar-x-axis";
export { BarYAxis } from "./bar-y-axis";
export { SeriesBar } from "./series-bar";
export { BarChartTooltip } from "./bar-chart-tooltip";
export type { BarChartTooltipProps } from "./bar-chart-tooltip";

// ── Pie & Ring ───────────────────────────────────────────────────────────────
export { PieChart } from "./pie-chart";
export type { PieChartProps } from "./pie-chart";
export { PieSlice } from "./pie-slice";
export type { PieSliceProps } from "./pie-slice";
export { PieCenter } from "./pie-center";
export { PieCenterShell } from "./pie-center-shell";

export { RingChart } from "./ring-chart";
export type { RingChartProps } from "./ring-chart";
export { Ring } from "./ring";
export type { RingProps } from "./ring";
export { RingCenter } from "./ring-center";

// ── Radar ────────────────────────────────────────────────────────────────────
export { RadarChart } from "./radar-chart";
export type { RadarChartProps } from "./radar-chart";
export { RadarArea } from "./radar-area";
export { RadarAxis } from "./radar-axis";
export { RadarGrid } from "./radar-grid";
export { RadarLabels } from "./radar-labels";

// ── Funnel ───────────────────────────────────────────────────────────────────
export { FunnelChart } from "./funnel-chart";
export type { FunnelChartProps } from "./funnel-chart";

// ── Gauge ────────────────────────────────────────────────────────────────────
export { Gauge } from "./gauge";
export type { GaugeProps } from "./gauge";

// ── Radial Bar ────────────────────────────────────────────────────────────────
export { RadialBarChart } from "./radial-bar-chart";
export type { RadialBarChartProps } from "./radial-bar-chart";
export { RadialBar } from "./radial-bar";
export type { RadialBarProps } from "./radial-bar";
export { RadialBarLabels } from "./radial-bar-labels";

// ── Treemap ──────────────────────────────────────────────────────────────────
export { TreemapChart } from "./treemap";
export type { TreemapChartProps, TreemapNode } from "./treemap";

// ── Sunburst ──────────────────────────────────────────────────────────────────
export { SunburstChart } from "./sunburst";
export type { SunburstChartProps, SunburstNode } from "./sunburst";

// ── Candlestick ───────────────────────────────────────────────────────────────
export { CandlestickChart } from "./candlestick-chart";
export type { CandlestickChartProps, CandlestickDatum } from "./candlestick-chart";

// ── Box Plot ──────────────────────────────────────────────────────────────────
export { BoxPlotChart } from "./box-plot";
export type { BoxPlotChartProps, BoxPlotDatum } from "./box-plot";

// ── Violin Plot ───────────────────────────────────────────────────────────────
export { ViolinPlotChart } from "./violin-plot";
export type { ViolinPlotChartProps, ViolinDatum } from "./violin-plot";

// ── Waterfall ─────────────────────────────────────────────────────────────────
export { WaterfallChart } from "./waterfall-chart";
export type { WaterfallChartProps, WaterfallItem } from "./waterfall-chart";

// ── Bubble ────────────────────────────────────────────────────────────────────
export { BubbleChart } from "./bubble-chart";
export type { BubbleChartProps, BubbleDatum } from "./bubble-chart";

// ── Scatter ──────────────────────────────────────────────────────────────────
export { ScatterChart } from "./scatter-chart";
export type { ScatterChartProps } from "./scatter-chart";
export { Scatter } from "./scatter";
export type { ScatterProps } from "./scatter";

// ── Shared primitives ────────────────────────────────────────────────────────
export { Grid } from "./grid";
export type { GridProps } from "./grid";
export { XAxis } from "./x-axis";
export { YAxis } from "./y-axis";
export { ChartLegend } from "./chart-legend";
export { ChartLegendHoverProvider, useChartLegendHover } from "./chart-legend-hover";
export { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from "./visx-pattern";

// ── Context / hooks ──────────────────────────────────────────────────────────
export {
  useChart,
  useChartStable,
  useChartHover,
  useYScale,
  ChartProvider,
  chartCssVars,
} from "./chart-context";
export type {
  ChartContextValue,
  ChartStableContextValue,
  LineConfig,
  TooltipData,
} from "./chart-context";

// ── Tooltip primitives ───────────────────────────────────────────────────────
export { TooltipBox } from "./tooltip/tooltip-box";
export type { TooltipBoxProps } from "./tooltip/tooltip-box";
export { TooltipContent } from "./tooltip/tooltip-content";
export type { TooltipContentProps, TooltipRow } from "./tooltip/tooltip-content";

// ── Heatmap Calendar ─────────────────────────────────────────────────────────
export { HeatmapCalendar } from "./heatmap-calendar";
export type { HeatmapCalendarProps } from "./heatmap-calendar";

// ── Mermaid ───────────────────────────────────────────────────────────────────
export { MermaidDiagram } from "./mermaid-diagram";
export type { MermaidDiagramProps } from "./mermaid-diagram";

// ── Timeline ──────────────────────────────────────────────────────────────────
export { TimelineChart } from "./timeline-chart";
export type { TimelineChartProps, TimelineItem } from "./timeline-chart";

// ── Network Graph ─────────────────────────────────────────────────────────────
export { NetworkGraph } from "./network-graph";
export type { NetworkGraphProps, NetworkNode, NetworkEdge } from "./network-graph";

// ── Utilities ────────────────────────────────────────────────────────────────
export { intFmt, shortDateFmt, weekdayDateFmt } from "./chart-formatters";
export { transitionWithDelay } from "./motion-utils";
export { useMountProgress } from "./use-mount-progress";
export {
  DEFAULT_CHART_ENTER_TRANSITION,
  DEFAULT_ANIMATION_DURATION_MS,
} from "./animation";
