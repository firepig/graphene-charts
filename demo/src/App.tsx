import React from "react";
import { curveStep } from "@visx/curve";
import { ThemeCreator, type VarMap, generateCSS } from "./ThemeCreator";

// ── Sankey ───────────────────────────────────────────────────────────────────
import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip } from "../../src/charts/sankey";

// ── Time-series ───────────────────────────────────────────────────────────────
import { LineChart } from "../../src/charts/line-chart";
import { Line } from "../../src/charts/line";
import { AreaChart } from "../../src/charts/area-chart";
import { Area } from "../../src/charts/area";
import { ComposedChart } from "../../src/charts/composed-chart";
import { SeriesBar } from "../../src/charts/series-bar";
import { Grid } from "../../src/charts/grid";
import { XAxis } from "../../src/charts/x-axis";
import { YAxis } from "../../src/charts/y-axis";

// ── Bar ───────────────────────────────────────────────────────────────────────
import { BarChart } from "../../src/charts/bar-chart";
import { Bar } from "../../src/charts/bar";
import { BarXAxis } from "../../src/charts/bar-x-axis";
import { BarYAxis } from "../../src/charts/bar-y-axis";

// ── Pie & Ring ────────────────────────────────────────────────────────────────
import { PieChart } from "../../src/charts/pie-chart";
import { PieSlice } from "../../src/charts/pie-slice";
import { PieCenter } from "../../src/charts/pie-center";
import { RingChart } from "../../src/charts/ring-chart";
import { Ring } from "../../src/charts/ring";
import { RingCenter } from "../../src/charts/ring-center";

// ── Radar ─────────────────────────────────────────────────────────────────────
import { RadarChart } from "../../src/charts/radar-chart";
import { RadarArea } from "../../src/charts/radar-area";
import { RadarAxis } from "../../src/charts/radar-axis";
import { RadarGrid } from "../../src/charts/radar-grid";
import { RadarLabels } from "../../src/charts/radar-labels";

// ── Radial Bar ────────────────────────────────────────────────────────────────
import { RadialBarChart } from "../../src/charts/radial-bar-chart";
import { RadialBar } from "../../src/charts/radial-bar";
import { RadialBarLabels } from "../../src/charts/radial-bar-labels";

// ── Funnel & Gauge ────────────────────────────────────────────────────────────
import { FunnelChart } from "../../src/charts/funnel-chart";
import { Gauge } from "../../src/charts/gauge";

// ── Scatter ───────────────────────────────────────────────────────────────────
import { ScatterChart } from "../../src/charts/scatter-chart";
import { Scatter } from "../../src/charts/scatter";

// ── New chart types ───────────────────────────────────────────────────────────
import { TreemapChart } from "../../src/charts/treemap";
import { HeatmapCalendar } from "../../src/charts/heatmap-calendar";
import { CandlestickChart } from "../../src/charts/candlestick-chart";
import { WaterfallChart } from "../../src/charts/waterfall-chart";
import { BubbleChart } from "../../src/charts/bubble-chart";
import { SunburstChart } from "../../src/charts/sunburst";
import { TimelineChart } from "../../src/charts/timeline-chart";
import { BoxPlotChart } from "../../src/charts/box-plot";
import { ViolinPlotChart } from "../../src/charts/violin-plot";
import { NetworkGraph } from "../../src/charts/network-graph";
import { MermaidDiagram } from "../../src/charts/mermaid-diagram";

// ── Patterns ──────────────────────────────────────────────────────────────────
import { PatternLines } from "../../src/charts/visx-pattern";
import { PatternArea } from "../../src/charts/pattern-area";

// ── Legend ────────────────────────────────────────────────────────────────────
import { ChartLegend } from "../../src/charts/chart-legend";
import { ChartLegendHoverProvider } from "../../src/charts/chart-legend-hover";

// ── Tooltip ───────────────────────────────────────────────────────────────────
import { TooltipBox } from "../../src/charts/tooltip/tooltip-box";
import { TooltipContent } from "../../src/charts/tooltip/tooltip-content";
import { useChart, useChartStable } from "../../src/charts/chart-context";

// ═══════════════════════════════ CUSTOM TOOLTIPS ═══════════════════════════════

/** Tooltip for the Composed (time-series) chart */
function CustomTooltip() {
  const { tooltipData } = useChart();
  const { containerRef, width, height } = useChartStable();

  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const y = tooltipData?.yPositions?.["revenue"] ?? tooltipData?.yPositions?.["sessions"] ?? 0;

  const revenue = tooltipData?.point?.["revenue"];
  const sessions = tooltipData?.point?.["sessions"];

  const rows = [];
  if (typeof revenue === "number") {
    rows.push({ color: "var(--chart-1)", label: "Revenue", value: revenue });
  }
  if (typeof sessions === "number") {
    rows.push({ color: "var(--chart-2)", label: "Sessions", value: sessions });
  }

  return (
    <TooltipBox
      containerHeight={height}
      containerRef={containerRef}
      containerWidth={width}
      visible={visible}
      x={x}
      y={y}
    >
      <TooltipContent rows={rows} title="Stats" />
    </TooltipBox>
  );
}

/** Tooltip for the stacked bar chart */
function StackedBarTooltip() {
  const { tooltipData } = useChart();
  const { containerRef, width, height } = useChartStable();

  const visible = tooltipData !== null;
  const x = tooltipData?.x ?? 0;
  const y = tooltipData?.yPositions?.["a"] ?? tooltipData?.yPositions?.["b"] ?? height / 2;
  const point = tooltipData?.point as Record<string, unknown> | undefined;

  const rows = [];
  if (typeof point?.["a"] === "number") rows.push({ color: "var(--chart-1)", label: "Series A", value: point["a"] as number });
  if (typeof point?.["b"] === "number") rows.push({ color: "var(--chart-2)", label: "Series B", value: point["b"] as number });
  const title = typeof point?.["name"] === "string" ? point["name"] : undefined;

  return (
    <TooltipBox containerHeight={height} containerRef={containerRef} containerWidth={width} visible={visible} x={x} y={y}>
      <TooltipContent rows={rows} title={title} />
    </TooltipBox>
  );
}

// ═══════════════════════════════ DATA ══════════════════════════════════════════

const sankeyData = {
  nodes: [
    { name: "A", category: "source" as const },
    { name: "B", category: "source" as const },
    { name: "X", category: "landing" as const },
    { name: "Y", category: "landing" as const },
    { name: "Z", category: "outcome" as const },
  ],
  links: [
    { source: 0, target: 2, value: 45 },
    { source: 0, target: 3, value: 15 },
    { source: 1, target: 2, value: 25 },
    { source: 1, target: 3, value: 40 },
    { source: 2, target: 4, value: 70 },
    { source: 3, target: 4, value: 55 },
  ],
};

function makeTimeSeries(days = 30) {
  const data = [];
  let v1 = 120;
  let v2 = 80;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    v1 = Math.max(20, v1 + (Math.random() - 0.48) * 20);
    v2 = Math.max(10, v2 + (Math.random() - 0.46) * 15);
    data.push({ date: d, revenue: Math.round(v1), sessions: Math.round(v2) });
  }
  return data;
}

const timeData = makeTimeSeries(30);

const barData = [
  { name: "Jan", a: 30,  b: 105 },
  { name: "Feb", a: 120, b: 38  },
  { name: "Mar", a: 55,  b: 140 },
  { name: "Apr", a: 155, b: 48  },
  { name: "May", a: 45,  b: 110 },
  { name: "Jun", a: 140, b: 60  },
  { name: "Jul", a: 80,  b: 125 },
];

const negBarData = [
  { name: "Q1", profit: 45, loss: -20 },
  { name: "Q2", profit: 62, loss: -35 },
  { name: "Q3", profit: 38, loss: -55 },
  { name: "Q4", profit: 80, loss: -18 },
];

const legendBarData = [
  { name: "Jan", a: 90,  b: 60 },
  { name: "Feb", a: 115, b: 75 },
  { name: "Mar", a: 78,  b: 90 },
  { name: "Apr", a: 140, b: 100 },
  { name: "May", a: 125, b: 115 },
];

const pieData = [
  { label: "Direct",   value: 38, color: "var(--chart-1)" },
  { label: "Organic",  value: 27, color: "var(--chart-2)" },
  { label: "Referral", value: 20, color: "var(--chart-3)" },
  { label: "Paid",     value: 15, color: "var(--chart-4)" },
];

const ringData = [
  { label: "Completed",   value: 68, maxValue: 100, color: "var(--chart-1)" },
  { label: "In progress", value: 22, maxValue: 100, color: "var(--chart-2)" },
  { label: "Pending",     value: 10, maxValue: 100, color: "var(--chart-border)" },
];

const radarMetrics = [
  { key: "speed",       label: "Speed" },
  { key: "reliability", label: "Reliability" },
  { key: "comfort",     label: "Comfort" },
  { key: "safety",      label: "Safety" },
  { key: "efficiency",  label: "Efficiency" },
  { key: "cost",        label: "Cost" },
];

const radarData = [
  { label: "Product A", color: "var(--chart-1)", values: { speed: 85, reliability: 90, comfort: 70, safety: 95, efficiency: 78, cost: 55 } },
  { label: "Product B", color: "var(--chart-2)", values: { speed: 65, reliability: 80, comfort: 88, safety: 92, efficiency: 70, cost: 75 } },
];

const funnelData = [
  { label: "Visitors",  value: 10000, color: "var(--chart-1)" },
  { label: "Signups",   value: 3200,  color: "var(--chart-2)" },
  { label: "Activated", value: 1800,  color: "var(--chart-3)" },
  { label: "Retained",  value: 950,   color: "var(--chart-4)" },
  { label: "Paying",    value: 420,   color: "var(--chart-5)" },
];

const scatterTimeData = (() => {
  const d = [];
  for (let i = 0; i < 40; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (40 - i));
    d.push({ date, sales: Math.round(30 + Math.random() * 120) });
  }
  return d;
})();

const radialBarData = [
  { label: "Mon", value: 72, color: "var(--chart-1)" },
  { label: "Tue", value: 58, color: "var(--chart-2)" },
  { label: "Wed", value: 89, color: "var(--chart-3)" },
  { label: "Thu", value: 43, color: "var(--chart-4)" },
  { label: "Fri", value: 95, color: "var(--chart-5)" },
  { label: "Sat", value: 67, color: "var(--chart-up)" },
  { label: "Sun", value: 31, color: "var(--chart-down)" },
];

// ── New chart data ─────────────────────────────────────────────────────────────

const treemapData = {
  name: "Revenue",
  children: [
    { name: "Product A", value: 420, color: "var(--chart-1)" },
    { name: "Product B", value: 310, color: "var(--chart-2)" },
    { name: "Product C", value: 185, color: "var(--chart-3)" },
    { name: "Product D", value: 130, color: "var(--chart-4)" },
    { name: "Product E", value: 90,  color: "var(--chart-5)" },
    { name: "Product F", value: 60,  color: "var(--chart-up)" },
    { name: "Product G", value: 45,  color: "var(--chart-down)" },
  ],
};

// ~1 year of synthetic daily contribution data
const heatmapData = (() => {
  const entries: { date: string; value: number }[] = [];
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  const cur = new Date(start);
  while (cur <= end) {
    if (Math.random() > 0.35) {
      entries.push({
        date: cur.toISOString().slice(0, 10),
        value: Math.floor(Math.random() * 12) + 1,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return entries;
})();

// ~60 trading days of OHLC data
const candlestickData = (() => {
  const items = [];
  let price = 150;
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const open = price + (Math.random() - 0.5) * 4;
    const close = open + (Math.random() - 0.48) * 6;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    items.push({ date: d, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
    price = close;
  }
  return items;
})();

const waterfallData = [
  { name: "Revenue",    value: 420,  type: "total" as const },
  { name: "COGS",       value: -110 },
  { name: "Gross",      value: 310,  type: "total" as const },
  { name: "R&D",        value: -65  },
  { name: "Sales",      value: -45  },
  { name: "G&A",        value: -30  },
  { name: "EBIT",       value: 170,  type: "total" as const },
  { name: "Interest",   value: -12  },
  { name: "Tax",        value: -34  },
  { name: "Net Income", value: 124,  type: "total" as const },
];

const bubbleData = [
  [
    { x: 20, y: 30, size: 15, label: "Alpha" },
    { x: 45, y: 60, size: 40, label: "Beta" },
    { x: 70, y: 25, size: 20, label: "Gamma" },
    { x: 35, y: 80, size: 55, label: "Delta" },
    { x: 85, y: 70, size: 10, label: "Epsilon" },
    { x: 55, y: 45, size: 30, label: "Zeta" },
  ],
  [
    { x: 15, y: 65, size: 25, label: "Eta" },
    { x: 60, y: 15, size: 45, label: "Theta" },
    { x: 80, y: 50, size: 18, label: "Iota" },
    { x: 30, y: 45, size: 35, label: "Kappa" },
    { x: 50, y: 85, size: 50, label: "Lambda" },
  ],
];

const sunburstData = {
  name: "Expenses",
  children: [
    {
      name: "Engineering", color: "var(--chart-1)", children: [
        { name: "Frontend", value: 120 },
        { name: "Backend",  value: 140 },
        { name: "Infra",    value: 80  },
      ],
    },
    {
      name: "Marketing", color: "var(--chart-2)", children: [
        { name: "Ads",      value: 95  },
        { name: "Content",  value: 55  },
        { name: "Events",   value: 40  },
      ],
    },
    {
      name: "Sales", color: "var(--chart-3)", children: [
        { name: "Outbound", value: 75  },
        { name: "Partners", value: 50  },
      ],
    },
    {
      name: "G&A", color: "var(--chart-4)", children: [
        { name: "HR",       value: 60  },
        { name: "Legal",    value: 35  },
        { name: "Finance",  value: 40  },
      ],
    },
  ],
};

const timelineItems = [
  { id: "1",  label: "Discovery",    start: "2025-01-06", end: "2025-01-24", group: "Phase 1", color: "var(--chart-1)" },
  { id: "2",  label: "Architecture", start: "2025-01-20", end: "2025-02-07", group: "Phase 1", color: "var(--chart-1)" },
  { id: "3",  label: "UI Design",    start: "2025-01-27", end: "2025-02-21", group: "Design",  color: "var(--chart-2)" },
  { id: "4",  label: "Prototyping",  start: "2025-02-10", end: "2025-02-28", group: "Design",  color: "var(--chart-2)" },
  { id: "5",  label: "API Dev",      start: "2025-02-03", end: "2025-03-14", group: "Backend", color: "var(--chart-3)" },
  { id: "6",  label: "Frontend Dev", start: "2025-02-24", end: "2025-04-04", group: "Frontend",color: "var(--chart-4)" },
  { id: "7",  label: "QA & Testing", start: "2025-03-17", end: "2025-04-11", group: "QA",      color: "var(--chart-5)" },
  { id: "8",  label: "Launch",       start: "2025-04-14", end: "2025-04-18", group: "Release", color: "var(--chart-up)" },
];

const boxPlotData = [
  { label: "Jan", min: 12, q1: 28, median: 45, q3: 62, max: 88, outliers: [5, 95], color: "var(--chart-1)" },
  { label: "Feb", min: 18, q1: 35, median: 52, q3: 70, max: 92, outliers: [8],     color: "var(--chart-2)" },
  { label: "Mar", min: 8,  q1: 22, median: 38, q3: 55, max: 78, outliers: [2, 85], color: "var(--chart-3)" },
  { label: "Apr", min: 25, q1: 42, median: 60, q3: 75, max: 94, outliers: [],      color: "var(--chart-4)" },
  { label: "May", min: 15, q1: 30, median: 48, q3: 68, max: 85, outliers: [3, 98], color: "var(--chart-5)" },
  { label: "Jun", min: 20, q1: 38, median: 55, q3: 72, max: 90, outliers: [10],    color: "var(--chart-up)" },
];

const violinData = [
  { label: "Group A", color: "var(--chart-1)", values: Array.from({ length: 80 }, () => 30 + Math.random() * 40 + (Math.random() > 0.8 ? 30 : 0)) },
  { label: "Group B", color: "var(--chart-2)", values: Array.from({ length: 80 }, () => 50 + Math.random() * 30 + (Math.random() > 0.7 ? -20 : 0)) },
  { label: "Group C", color: "var(--chart-3)", values: Array.from({ length: 80 }, () => 20 + Math.random() * 60) },
  { label: "Group D", color: "var(--chart-4)", values: Array.from({ length: 80 }, () => 60 + (Math.random() - 0.5) * 20) },
];

const networkNodes = [
  { id: "api",      label: "API",       size: 18, group: "core"     },
  { id: "auth",     label: "Auth",      size: 14, group: "core"     },
  { id: "db",       label: "Database",  size: 16, group: "core"     },
  { id: "cache",    label: "Cache",     size: 12, group: "infra"    },
  { id: "queue",    label: "Queue",     size: 12, group: "infra"    },
  { id: "worker",   label: "Worker",    size: 10, group: "infra"    },
  { id: "web",      label: "Web",       size: 14, group: "client"   },
  { id: "mobile",   label: "Mobile",    size: 12, group: "client"   },
  { id: "cdn",      label: "CDN",       size: 10, group: "client"   },
  { id: "monitor",  label: "Monitor",   size: 10, group: "ops"      },
];

const networkEdges = [
  { source: "web",    target: "api",    weight: 2 },
  { source: "mobile", target: "api",    weight: 2 },
  { source: "cdn",    target: "web",    weight: 1 },
  { source: "api",    target: "auth",   weight: 2 },
  { source: "api",    target: "db",     weight: 2 },
  { source: "api",    target: "cache",  weight: 1 },
  { source: "api",    target: "queue",  weight: 1 },
  { source: "queue",  target: "worker", weight: 1 },
  { source: "worker", target: "db",     weight: 1 },
  { source: "db",     target: "cache",  weight: 1 },
  { source: "monitor",target: "api",    weight: 1 },
  { source: "monitor",target: "db",     weight: 1 },
];

const mermaidFlowchart = `flowchart LR
  A([User]) --> B[Web App]
  B --> C{Auth?}
  C -->|yes| D[API Gateway]
  C -->|no| E[Login Page]
  D --> F[(Database)]
  D --> G[Cache]
  D --> H[Queue]
  H --> I[Worker]
  I --> F`;

const mermaidSequence = `sequenceDiagram
  participant U as User
  participant A as API
  participant D as DB
  participant C as Cache
  U->>A: GET /dashboard
  A->>C: Check cache
  C-->>A: Miss
  A->>D: Query data
  D-->>A: Results
  A->>C: Store result
  A-->>U: 200 OK`;

// ═══════════════════════════════ THEME SWITCHER ════════════════════════════════

const THEMES = [
  { id: "gc-dark",       label: "Dark",       swatch: "#8b5cf6" },
  { id: "gc-light",      label: "Light",      swatch: "#8b5cf6" },
  { id: "gc-ocean",      label: "Ocean",      swatch: "#3b82f6" },
  { id: "gc-rose",       label: "Rose",       swatch: "#f43f5e" },
  { id: "gc-cyberpunk",  label: "Cyberpunk",  swatch: "#f0ff00" },
  { id: "gc-mono",       label: "Mono",       swatch: "#888888" },
  { id: "gc-mono-light", label: "Mono Light", swatch: "#3a3a3a" },
] as const;

type MermaidConfig = { mermaidTheme: string; themeVariables?: Record<string, string> };

const MERMAID_CONFIGS: Record<string, MermaidConfig> = {
  "gc-dark":       { mermaidTheme: "dark",    themeVariables: { background: "#0d1117", primaryColor: "#8b5cf6", primaryTextColor: "#e2e8f0", lineColor: "#475569", secondaryColor: "#1e2535", mainBkg: "#1e293b", nodeBorder: "#475569", nodeTextColor: "#e2e8f0", edgeLabelBackground: "#1e2535" } },
  "gc-light":      { mermaidTheme: "default", themeVariables: { primaryColor: "#8b5cf6", primaryTextColor: "#0f172a", lineColor: "#94a3b8" } },
  "gc-ocean":      { mermaidTheme: "dark",    themeVariables: { background: "#0a1628", primaryColor: "#3b82f6", primaryTextColor: "#e0f2fe", lineColor: "#4a7fa5", secondaryColor: "#0f2044", mainBkg: "#0f2044", nodeBorder: "#1e3a5f", nodeTextColor: "#e0f2fe", edgeLabelBackground: "#0f2044" } },
  "gc-rose":       { mermaidTheme: "dark",    themeVariables: { background: "#1a0a10", primaryColor: "#f43f5e", primaryTextColor: "#fce7f3", lineColor: "#9f4f6a", secondaryColor: "#2a1020", mainBkg: "#2a1020", nodeBorder: "#4a1530", nodeTextColor: "#fce7f3", edgeLabelBackground: "#2a1020" } },
  "gc-cyberpunk":  { mermaidTheme: "dark",    themeVariables: { background: "#08000f", primaryColor: "#f0ff00", primaryTextColor: "#f0ff00", primaryBorderColor: "#00ffff", lineColor: "#00ffff", secondaryColor: "#0e0018", mainBkg: "#0e0018", nodeBorder: "#2a0055", nodeTextColor: "#eeeeff", edgeLabelBackground: "#0e0018", titleColor: "#f0ff00" } },
  "gc-mono":       { mermaidTheme: "dark",    themeVariables: { background: "#090909", primaryColor: "#ffffff", primaryTextColor: "#f0f0f0", lineColor: "#585858", secondaryColor: "#141414", mainBkg: "#141414", nodeBorder: "#282828", nodeTextColor: "#f0f0f0", edgeLabelBackground: "#141414" } },
  "gc-mono-light": { mermaidTheme: "default", themeVariables: { primaryColor: "#111111", primaryTextColor: "#111111", primaryBorderColor: "#3a3a3a", lineColor: "#8c8c8c" } },
};

type ThemeId = typeof THEMES[number]["id"] | "gc-custom";

function ThemeSwitcher({
  theme,
  onChange,
  onOpenCreator,
}: {
  theme: ThemeId;
  onChange: (t: ThemeId) => void;
  onOpenCreator: () => void;
}) {
  return (
    <div className="theme-bar">
      <span className="theme-bar-label">Theme</span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          className={`theme-btn${theme === t.id ? " active" : ""}`}
          style={theme === t.id ? { background: t.swatch } : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="theme-swatch" style={{ background: t.swatch }} />
          {t.label}
        </button>
      ))}
      {theme === "gc-custom" && (
        <button
          className="theme-btn active"
          style={{ background: "var(--chart-1)" }}
          onClick={() => onChange("gc-custom")}
        >
          <span className="theme-swatch" style={{ background: "var(--chart-1)" }} />
          Custom
        </button>
      )}
      <div style={{ flex: 1 }} />
      <button
        className="theme-btn"
        style={{ borderColor: "var(--chart-axis)", gap: 5 }}
        onClick={onOpenCreator}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M11 2.5a2.5 2.5 0 1 0 .603 4.932L13.5 9.5a1 1 0 0 0 1.414-1.414l-1.897-1.897A2.5 2.5 0 0 0 11 2.5M4 7a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2zm0 3a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2zM2 5a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1" />
        </svg>
        Theme Creator
      </button>
    </div>
  );
}

// ═══════════════════════════════ APP ═══════════════════════════════════════════

export default function App() {
  const [selectedPieIndex, setSelectedPieIndex] = React.useState<number | null>(null);
  const [hoveredLegendIndex, setHoveredLegendIndex] = React.useState<number | null>(null);
  const [theme, setTheme] = React.useState<ThemeId>("gc-dark");
  const [fading, setFading] = React.useState(false);
  const [creatorOpen, setCreatorOpen] = React.useState(false);

  function switchTheme(next: ThemeId) {
    if (next === theme) return;
    setFading(true);
    setTimeout(() => {
      setTheme(next);
      setFading(false);
    }, 180);
  }

  // Apply theme class to <html> so CSS vars cascade to body and everything.
  // When gc-custom is active, inject the custom style block into <head>.
  React.useEffect(() => {
    document.getElementById("gc-custom-style")?.remove();
    document.documentElement.className = theme;
  }, [theme]);

  function handleApplyCustomTheme(vars: VarMap) {
    // Remove any prior custom style block
    document.getElementById("gc-custom-style")?.remove();
    // Inject new block
    const style = document.createElement("style");
    style.id = "gc-custom-style";
    style.textContent = generateCSS(vars);
    document.head.appendChild(style);
    // Switch to gc-custom theme
    setCreatorOpen(false);
    setFading(true);
    setTimeout(() => {
      setTheme("gc-custom");
      setFading(false);
    }, 180);
  }

  return (
    <>
      <ThemeSwitcher theme={theme} onChange={switchTheme} onOpenCreator={() => setCreatorOpen(true)} />
      <ThemeCreator
        isOpen={creatorOpen}
        currentThemeClass={theme === "gc-custom" ? "gc-dark" : theme}
        onClose={() => setCreatorOpen(false)}
        onApply={handleApplyCustomTheme}
      />
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: "opacity 0.18s ease",
        }}
      >
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="hero">
          <div className="hero-badge">MIT Licensed · Open Source</div>
          <h1>Graphene Charts</h1>
          <p className="subtitle">
            20+ production-grade React chart components. Theme everything with one CSS class.
            Built on visx, d3, and Motion — no shadcn/ui required.
          </p>
          <div className="install-block">
            <code className="install-cmd">npm install graphene-charts</code>
            <div className="install-usage">
              <span className="install-comment">{"// import the theme "}
              </span>
              <span>import 'graphene-charts/themes.css'</span>
              <span className="install-comment">{"// wrap your app"}</span>
              <span>{"<div className=\"gc-dark\">"}</span>
            </div>
          </div>
          <div className="hero-links">
            <a className="hero-link hero-link-primary" href="https://github.com/firepig/graphene-charts" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="hero-link" href="#charts">Browse charts ↓</a>
          </div>
        </div>

        {/* ── SECTION NAV ──────────────────────────────────────────────────── */}
        <nav className="section-nav">
          {[
            ["#sankey",      "Sankey"],
            ["#timeseries",  "Time-series"],
            ["#bar",         "Bar"],
            ["#pie",         "Pie & Ring"],
            ["#radial",      "Radial"],
            ["#funnel",      "Funnel & Gauge"],
            ["#scatter",     "Scatter"],
            ["#treemap",     "Treemap"],
            ["#heatmap",     "Heatmap"],
            ["#candlestick", "Candlestick"],
            ["#waterfall",   "Waterfall"],
            ["#bubble",      "Bubble"],
            ["#sunburst",    "Sunburst"],
            ["#timeline",    "Timeline"],
            ["#boxplot",     "Box & Violin"],
            ["#network",     "Network"],
            ["#mermaid",     "Mermaid"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="snav-link">{label}</a>
          ))}
        </nav>

        <div id="charts" />

      {/* ── SANKEY ──────────────────────────────────────────────────────────── */}
      <section id="sankey" className="section">
        <div className="section-title">Sankey</div>
        <div className="card">
          <div className="card-title">User flow A/B → X/Y → Z</div>
          <SankeyChart
            data={sankeyData}
            aspectRatio="3 / 1"
            nodeWidth={14}
            nodePadding={20}
            margin={{ top: 20, right: 140, bottom: 20, left: 140 }}
          >
            <SankeyLink strokeOpacity={0.45} fadedOpacity={0.08} />
            <SankeyNode lineCap={3} fadedOpacity={0.35} />
            <SankeyTooltip />
          </SankeyChart>
        </div>
      </section>

      {/* ── LINE & AREA ──────────────────────────────────────────────────────── */}
      <section id="timeseries" className="section">
        <div className="section-title">Line &amp; Area</div>
        <div className="grid-2">

          {/* 1. Multi-series line + legend */}
          <div className="card">
            <div className="card-title">Multi-series line</div>
            <LineChart data={timeData} xDataKey="date" aspectRatio="2 / 1">
              <Grid />
              <XAxis />
              <YAxis />
              <Line dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} />
              <Line dataKey="sessions" stroke="var(--chart-2)" strokeWidth={2} />
            </LineChart>
            <ChartLegend
              items={[
                { label: "Revenue", value: timeData[timeData.length - 1]?.revenue ?? 0, color: "var(--chart-1)" },
                { label: "Sessions", value: timeData[timeData.length - 1]?.sessions ?? 0, color: "var(--chart-2)" },
              ]}
              showValue
            />
          </div>

          {/* 2. Step curve line */}
          <div className="card">
            <div className="card-title">Step curve line</div>
            <LineChart data={timeData} xDataKey="date" aspectRatio="2 / 1">
              <Grid />
              <XAxis />
              <YAxis />
              <Line dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} curve={curveStep} />
              <Line dataKey="sessions" stroke="var(--chart-2)" strokeWidth={2} curve={curveStep} />
            </LineChart>
          </div>

          {/* 3. Pattern (hatched) area */}
          <div className="card">
            <div className="card-title">Pattern fill area</div>
            <AreaChart data={timeData} xDataKey="date" stackMode="normal" aspectRatio="2 / 1">
              <Grid />
              <XAxis />
              <YAxis />
              <PatternLines id="hatch-1" height={6} width={6} stroke="var(--chart-1)" strokeWidth={1.5} />
              <PatternArea dataKey="revenue" fill="url(#hatch-1)" />
              <Area dataKey="sessions" fill="var(--chart-2)" fillOpacity={0.4} stroke="var(--chart-2)" strokeWidth={2} />
            </AreaChart>
          </div>

          {/* 4. 100% stacked area */}
          <div className="card">
            <div className="card-title">100% stacked area</div>
            <AreaChart data={timeData} xDataKey="date" stackMode="percent" aspectRatio="2 / 1">
              <Grid />
              <XAxis />
              <YAxis />
              <Area dataKey="revenue" fill="var(--chart-1)" fillOpacity={0.6} stroke="var(--chart-1)" strokeWidth={2} />
              <Area dataKey="sessions" fill="var(--chart-2)" fillOpacity={0.6} stroke="var(--chart-2)" strokeWidth={2} />
            </AreaChart>
          </div>

        </div>
      </section>

      {/* ── BAR ─────────────────────────────────────────────────────────────── */}
      <section id="bar" className="section">
        <div className="section-title">Bar</div>
        <div className="grid-2">

          {/* 1. Grouped bars + legend */}
          <div className="card">
            <div className="card-title">Grouped bars</div>
            <BarChart data={barData} xDataKey="name" aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <YAxis />
              <Bar dataKey="a" fill="var(--chart-1)" />
              <Bar dataKey="b" fill="var(--chart-2)" />
            </BarChart>
            <ChartLegend
              items={[
                { label: "Series A", value: barData.reduce((s, d) => s + d.a, 0), color: "var(--chart-1)" },
                { label: "Series B", value: barData.reduce((s, d) => s + d.b, 0), color: "var(--chart-2)" },
              ]}
              showValue
            />
          </div>

          {/* 2. Stacked bars + tooltip */}
          <div className="card">
            <div className="card-title">Stacked bars</div>
            <BarChart data={barData} xDataKey="name" stacked aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <YAxis />
              <Bar dataKey="a" fill="var(--chart-1)" />
              <Bar dataKey="b" fill="var(--chart-2)" />
              <StackedBarTooltip />
            </BarChart>
          </div>

          {/* 3. 100% stacked */}
          <div className="card">
            <div className="card-title">100% stacked</div>
            <BarChart data={barData} xDataKey="name" stacked stackMode="percent" aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <YAxis />
              <Bar dataKey="a" fill="var(--chart-1)" />
              <Bar dataKey="b" fill="var(--chart-2)" />
            </BarChart>
          </div>

          {/* 4. Horizontal bars */}
          <div className="card">
            <div className="card-title">Horizontal bars</div>
            <BarChart data={barData} xDataKey="name" orientation="horizontal" aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <BarYAxis />
              <Bar dataKey="a" fill="var(--chart-1)" />
              <Bar dataKey="b" fill="var(--chart-2)" />
            </BarChart>
          </div>

          {/* 5. Negative values */}
          <div className="card">
            <div className="card-title">Negative values</div>
            <BarChart data={negBarData} xDataKey="name" aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <YAxis />
              <Bar dataKey="profit" fill="var(--chart-1)" />
              <Bar dataKey="loss" fill="var(--chart-4)" />
            </BarChart>
          </div>

          {/* 6. Pattern fill */}
          <div className="card">
            <div className="card-title">Pattern fill</div>
            <BarChart data={barData} xDataKey="name" aspectRatio="2 / 1">
              <Grid />
              <BarXAxis />
              <YAxis />
              <PatternLines id="bar-stripe" height={6} width={6} stroke="var(--chart-1)" strokeWidth={1.5} />
              <Bar dataKey="a" fill="url(#bar-stripe)" stroke="var(--chart-1)" />
              <Bar dataKey="b" fill="var(--chart-2)" />
            </BarChart>
          </div>

        </div>
      </section>

      {/* ── COMPOSED ────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-title">Composed (bars + line)</div>
        <div className="card">
          <div className="card-title">Revenue bars + sessions trend — custom tooltip</div>
          <ComposedChart data={timeData} xDataKey="date" aspectRatio="2.5 / 1">
            <Grid />
            <XAxis />
            <YAxis />
            <SeriesBar dataKey="revenue" fill="var(--chart-1)" />
            <Line dataKey="sessions" stroke="var(--chart-2)" strokeWidth={2.5} />
            <CustomTooltip />
          </ComposedChart>
        </div>
      </section>

      {/* ── PIE & RING ──────────────────────────────────────────────────────── */}
      <section id="pie" className="section">
        <div className="section-title">Pie &amp; Ring</div>
        <div className="grid-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>

          {/* 1. Traffic sources (click to select) */}
          <div className="card">
            <div className="card-title">Traffic sources (click to select)</div>
            <PieChart data={pieData} size={280} selectedIndex={selectedPieIndex}>
              {pieData.map((d, i) => (
                <PieSlice
                  key={d.label}
                  index={i}
                  fill={d.color}
                  onClick={(idx) => setSelectedPieIndex(selectedPieIndex === idx ? null : idx)}
                />
              ))}
            </PieChart>
          </div>

          {/* 2. Donut with center */}
          <div className="card">
            <div className="card-title">Donut with center</div>
            <PieChart data={pieData} size={280} innerRadius={70}>
              {pieData.map((d, i) => (
                <PieSlice
                  key={d.label}
                  index={i}
                  fill={d.color}
                />
              ))}
              <PieCenter defaultLabel="Total" />
            </PieChart>
          </div>

          {/* 3. Ring with center */}
          <div className="card">
            <div className="card-title">Task completion</div>
            <RingChart data={ringData} size={280}>
              {ringData.map((d, i) => (
                <Ring key={d.label} index={i} color={d.color} />
              ))}
              <RingCenter defaultLabel="Tasks" />
            </RingChart>
          </div>

        </div>
      </section>

      {/* ── RADIAL BAR ──────────────────────────────────────────────────────── */}
      <section id="radial" className="section">
        <div className="section-title">Radial Bar</div>
        <div className="card" style={{ maxWidth: 400 }}>
          <div className="card-title">Weekly activity</div>
          <RadialBarChart data={radialBarData} size={320} innerRadius={40}>
            {radialBarData.map((_, i) => (
              <RadialBar key={i} index={i} />
            ))}
            <RadialBarLabels />
          </RadialBarChart>
        </div>
      </section>

      {/* ── RADAR ───────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-title">Radar</div>
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-title">Product A vs B</div>
          <RadarChart data={radarData} metrics={radarMetrics}>
            <RadarGrid />
            <RadarAxis />
            <RadarLabels />
            <RadarArea index={0} />
            <RadarArea index={1} />
          </RadarChart>
        </div>
      </section>

      {/* ── LEGEND ──────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="section-title">Legend</div>
        <div className="grid-2">

          {/* Bar chart + interactive legend */}
          <div className="card">
            <div className="card-title">Bar chart + interactive legend</div>
            <ChartLegendHoverProvider
              hoveredIndex={hoveredLegendIndex}
              onHoverChange={setHoveredLegendIndex}
            >
              <BarChart data={legendBarData} xDataKey="name" aspectRatio="2 / 1">
                <Grid />
                <BarXAxis />
                <YAxis />
                <Bar dataKey="a" fill="var(--chart-1)" />
                <Bar dataKey="b" fill="var(--chart-2)" />
              </BarChart>
              <ChartLegend
                hoveredIndex={hoveredLegendIndex}
                onHover={setHoveredLegendIndex}
                items={[
                  { label: "Series A", value: legendBarData.reduce((s, d) => s + d.a, 0), color: "var(--chart-1)" },
                  { label: "Series B", value: legendBarData.reduce((s, d) => s + d.b, 0), color: "var(--chart-2)" },
                ]}
                showValue
                showPercentage={false}
              />
            </ChartLegendHoverProvider>
          </div>

          {/* Legend variants */}
          <div className="card">
            <div className="card-title">Legend variants — with progress</div>
            <ChartLegend
              items={pieData.map((d) => ({ label: d.label, value: d.value, maxValue: 100, color: d.color }))}
              showProgress
              showMarker
              showValue
              showPercentage
            />
          </div>

        </div>
      </section>

      {/* ── FUNNEL & GAUGE ──────────────────────────────────────────────────── */}
      <section id="funnel" className="section">
        <div className="section-title">Funnel &amp; Gauge</div>
        <div className="grid-2">
          <div className="card" style={{ height: 320 }}>
            <div className="card-title">Conversion funnel</div>
            <FunnelChart
              data={funnelData}
              showValues
              showLabels
              showPercentage
              orientation="horizontal"
              style={{ height: 280 }}
            />
          </div>
          <div className="card" style={{ height: 320, display: "flex", flexDirection: "column" }}>
            <div className="card-title">Performance score</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Gauge
                value={72}
                centerValue={72}
                defaultLabel="Score"
                activeFill="var(--chart-1)"
                inactiveFill="var(--chart-border)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SCATTER ─────────────────────────────────────────────────────────── */}
      <section id="scatter" className="section">
        <div className="section-title">Scatter</div>
        <div className="card">
          <div className="card-title">Daily sales over time</div>
          <ScatterChart data={scatterTimeData} xDataKey="date" aspectRatio="2.5 / 1">
            <Grid />
            <XAxis />
            <YAxis />
            <Scatter dataKey="sales" fill="var(--chart-1)" radius={4} />
          </ScatterChart>
        </div>
      </section>

      {/* ── TREEMAP ─────────────────────────────────────────────────────────── */}
      <section id="treemap" className="section">
        <div className="section-title">Treemap</div>
        <div className="card">
          <div className="card-title">Revenue by product</div>
          <TreemapChart data={treemapData} aspectRatio="2 / 1" padding={3} />
        </div>
      </section>

      {/* ── BUBBLE ──────────────────────────────────────────────────────────── */}
      <section id="bubble" className="section">
        <div className="section-title">Bubble</div>
        <div className="card">
          <div className="card-title">Multi-series bubble — size encodes third dimension</div>
          <BubbleChart
            data={bubbleData}
            aspectRatio="2 / 1"
            xLabel="Engagement"
            yLabel="Retention"
            fillOpacity={0.65}
          />
        </div>
      </section>

      {/* ── CANDLESTICK ─────────────────────────────────────────────────────── */}
      <section id="candlestick" className="section">
        <div className="section-title">Candlestick / OHLC</div>
        <div className="card">
          <div className="card-title">60-day price history</div>
          <CandlestickChart data={candlestickData} aspectRatio="3 / 1" />
        </div>
      </section>

      {/* ── WATERFALL ───────────────────────────────────────────────────────── */}
      <section id="waterfall" className="section">
        <div className="section-title">Waterfall</div>
        <div className="card">
          <div className="card-title">P&amp;L bridge — running totals with deltas</div>
          <WaterfallChart data={waterfallData} aspectRatio="3 / 1" showValues />
        </div>
      </section>

      {/* ── HEATMAP CALENDAR ────────────────────────────────────────────────── */}
      <section id="heatmap" className="section">
        <div className="section-title">Heatmap Calendar</div>
        <div className="card">
          <div className="card-title">Activity over the past year</div>
          <HeatmapCalendar data={heatmapData} />
        </div>
      </section>

      {/* ── SUNBURST ────────────────────────────────────────────────────────── */}
      <section id="sunburst" className="section">
        <div className="section-title">Sunburst</div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Expense breakdown — solid</div>
            <SunburstChart data={sunburstData} size={320} />
          </div>
          <div className="card">
            <div className="card-title">Expense breakdown — donut</div>
            <SunburstChart data={sunburstData} size={320} innerRadius={48} />
          </div>
        </div>
      </section>

      {/* ── TIMELINE ────────────────────────────────────────────────────────── */}
      <section id="timeline" className="section">
        <div className="section-title">Timeline / Gantt</div>
        <div className="card">
          <div className="card-title">Project roadmap Q1–Q2 2025</div>
          <TimelineChart items={timelineItems} barHeight={22} barGap={8} />
        </div>
      </section>

      {/* ── BOX PLOT & VIOLIN ───────────────────────────────────────────────── */}
      <section id="boxplot" className="section">
        <div className="section-title">Statistical</div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Box plot — monthly distribution</div>
            <BoxPlotChart data={boxPlotData} aspectRatio="2 / 1" />
          </div>
          <div className="card">
            <div className="card-title">Violin plot — group distributions</div>
            <ViolinPlotChart data={violinData} aspectRatio="2 / 1" showMedian showQuartiles />
          </div>
        </div>
      </section>

      {/* ── NETWORK GRAPH ───────────────────────────────────────────────────── */}
      <section id="network" className="section">
        <div className="section-title">Network Graph</div>
        <div className="card">
          <div className="card-title">Service architecture — drag nodes to explore</div>
          <NetworkGraph
            nodes={networkNodes}
            edges={networkEdges}
            aspectRatio="2 / 1"
            chargeStrength={-160}
            linkDistance={80}
            showLabels
          />
        </div>
      </section>

      {/* ── MERMAID ─────────────────────────────────────────────────────────── */}
      <section id="mermaid" className="section">
        <div className="section-title">Mermaid Diagrams</div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Flowchart — system architecture</div>
            <MermaidDiagram chart={mermaidFlowchart} mermaidTheme={MERMAID_CONFIGS[theme]?.mermaidTheme} themeVariables={MERMAID_CONFIGS[theme]?.themeVariables} />
          </div>
          <div className="card">
            <div className="card-title">Sequence diagram — request flow</div>
            <MermaidDiagram chart={mermaidSequence} mermaidTheme={MERMAID_CONFIGS[theme]?.mermaidTheme} themeVariables={MERMAID_CONFIGS[theme]?.themeVariables} />
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
