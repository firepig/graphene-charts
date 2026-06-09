# Graphene Charts

> Production-grade animated React chart library built on [@visx](https://airbnb.io/visx/), [D3](https://d3js.org/), and [Framer Motion](https://motion.dev/). Dark-theme-first, zero shadcn/ui dependency, fully typed.

---

## What's included

| Category | Charts |
|---|---|
| **Time-series** | Line, Area (stacked, 100%), Composed (bars + line) |
| **Bar** | Grouped, Stacked, 100% Stacked, Horizontal, Negative values, Pattern fill |
| **Circular** | Pie, Donut (with center), Ring, Radial Bar, Sunburst |
| **Statistical** | Box Plot, Violin Plot, Scatter, Bubble |
| **Hierarchical** | Treemap, Sankey, Sunburst |
| **Finance** | Candlestick / OHLC |
| **Flow** | Waterfall, Network Graph (force-directed), Mermaid Diagrams |
| **Specialty** | Radar, Funnel, Gauge, Heatmap Calendar, Timeline / Gantt |

All charts include:
- **Animated entry** — Framer Motion spring/tween transitions with configurable stagger
- **Hover effects** — translate, grow, glow, fade depending on chart type
- **Responsive sizing** — fills parent container or accepts a fixed `size` / `aspectRatio` prop
- **Dark theme out of the box** — CSS variable palette, easy to override
- **Full TypeScript** — all props and data shapes are typed

---

## Installation

```bash
npm install graphene-charts
```

Peer dependencies (install if not already present):

```bash
npm install react react-dom
```

---

## Quickstart

### 1. Apply the theme

Wrap your app (or just the chart container) in the `v` class to activate the default dark palette:

```tsx
<div className="v">
  {/* charts go here */}
</div>
```

Or define the CSS variables yourself on any element:

```css
.my-theme {
  --chart-1: #8b5cf6;
  --chart-2: #06b6d4;
  --chart-3: #10b981;
  --chart-4: #f59e0b;
  --chart-5: #ef4444;
  --chart-foreground: #e2e8f0;
  --chart-foreground-muted: #475569;
  --chart-grid: rgba(255, 255, 255, 0.06);
  --chart-tooltip-background: rgba(13, 17, 23, 0.95);
  --chart-tooltip-foreground: #f1f5f9;
}
```

### 2. Line chart

```tsx
import { LineChart, Line, Grid, XAxis, YAxis } from "graphene-charts";

const data = [
  { date: new Date("2025-01-01"), revenue: 120, sessions: 85 },
  { date: new Date("2025-02-01"), revenue: 145, sessions: 92 },
  { date: new Date("2025-03-01"), revenue: 138, sessions: 78 },
];

export function MyChart() {
  return (
    <LineChart data={data} xDataKey="date" aspectRatio="2 / 1">
      <Grid />
      <XAxis />
      <YAxis />
      <Line dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} />
      <Line dataKey="sessions" stroke="var(--chart-2)" strokeWidth={2} />
    </LineChart>
  );
}
```

### 3. Bar chart

```tsx
import { BarChart, Bar, BarXAxis, YAxis, Grid } from "graphene-charts";

const data = [
  { name: "Jan", a: 30, b: 105 },
  { name: "Feb", a: 120, b: 38 },
  { name: "Mar", a: 55, b: 140 },
];

// Grouped bars
<BarChart data={data} xDataKey="name" aspectRatio="2 / 1">
  <Grid />
  <BarXAxis />
  <YAxis />
  <Bar dataKey="a" fill="var(--chart-1)" />
  <Bar dataKey="b" fill="var(--chart-2)" />
</BarChart>

// Stacked bars
<BarChart data={data} xDataKey="name" stacked aspectRatio="2 / 1">
  ...
</BarChart>

// 100% stacked
<BarChart data={data} xDataKey="name" stacked stackMode="percent" aspectRatio="2 / 1">
  ...
</BarChart>

// Horizontal
<BarChart data={data} xDataKey="name" orientation="horizontal" aspectRatio="2 / 1">
  ...
</BarChart>
```

### 4. Pie / Donut chart

```tsx
import { PieChart, PieSlice, PieCenter } from "graphene-charts";

const data = [
  { label: "Direct",   value: 38, color: "#8b5cf6" },
  { label: "Organic",  value: 27, color: "#06b6d4" },
  { label: "Referral", value: 20, color: "#10b981" },
];

// Solid pie
<PieChart data={data} size={300}>
  {data.map((d, i) => <PieSlice key={d.label} index={i} />)}
</PieChart>

// Donut with center label
<PieChart data={data} size={300} innerRadius={70}>
  {data.map((d, i) => <PieSlice key={d.label} index={i} />)}
  <PieCenter defaultLabel="Total" />
</PieChart>
```

### 5. Area chart

```tsx
import { AreaChart, Area, Grid, XAxis, YAxis } from "graphene-charts";

// Stacked area
<AreaChart data={data} xDataKey="date" stacked aspectRatio="2 / 1">
  <Grid />
  <XAxis />
  <YAxis />
  <Area dataKey="revenue" fill="var(--chart-1)" fillOpacity={0.5} stroke="var(--chart-1)" />
  <Area dataKey="sessions" fill="var(--chart-2)" fillOpacity={0.5} stroke="var(--chart-2)" />
</AreaChart>

// 100% stacked
<AreaChart data={data} xDataKey="date" stacked stackMode="percent" aspectRatio="2 / 1">
  ...
</AreaChart>
```

### 6. Tooltips

Render a custom tooltip inside any chart that uses `ChartProvider` (Line, Area, Bar, Composed, Scatter):

```tsx
import {
  LineChart, Line,
  TooltipBox, TooltipContent,
  useChart, useChartStable,
} from "graphene-charts";

function MyTooltip() {
  const { tooltipData } = useChart();
  const { containerRef, width, height } = useChartStable();

  return (
    <TooltipBox
      containerRef={containerRef}
      containerWidth={width}
      containerHeight={height}
      visible={tooltipData !== null}
      x={tooltipData?.x ?? 0}
      y={tooltipData?.yPositions?.["revenue"] ?? 0}
    >
      <TooltipContent
        title={String(tooltipData?.point?.["date"] ?? "")}
        rows={[
          { color: "var(--chart-1)", label: "Revenue", value: tooltipData?.point?.["revenue"] as number },
        ]}
      />
    </TooltipBox>
  );
}

// Use inside the chart:
<LineChart data={data} xDataKey="date">
  <Line dataKey="revenue" stroke="var(--chart-1)" />
  <MyTooltip />
</LineChart>
```

### 7. Legend

```tsx
import { ChartLegend, ChartLegendHoverProvider } from "graphene-charts";

// Static legend with values
<ChartLegend
  items={[
    { label: "Revenue", value: 1420, color: "var(--chart-1)" },
    { label: "Sessions", value: 830,  color: "var(--chart-2)" },
  ]}
  showValue
/>

// Interactive legend that syncs hover state with a bar chart
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

<ChartLegendHoverProvider hoveredIndex={hoveredIndex} onHoverChange={setHoveredIndex}>
  <BarChart data={data} xDataKey="name">
    <Bar dataKey="a" fill="var(--chart-1)" />
    <Bar dataKey="b" fill="var(--chart-2)" />
  </BarChart>
  <ChartLegend
    hoveredIndex={hoveredIndex}
    onHover={setHoveredIndex}
    items={[
      { label: "Series A", value: 530, color: "var(--chart-1)" },
      { label: "Series B", value: 379, color: "var(--chart-2)" },
    ]}
    showValue
    showProgress
  />
</ChartLegendHoverProvider>
```

### 8. Pattern fills

```tsx
import { PatternLines, PatternCircles, PatternWaves } from "graphene-charts";

// Inside an SVG-backed chart (BarChart, AreaChart, etc.)
<BarChart data={data} xDataKey="name">
  <PatternLines id="hatch" height={6} width={6} stroke="var(--chart-1)" strokeWidth={1.5} />
  <Bar dataKey="a" fill="url(#hatch)" stroke="var(--chart-1)" />
</BarChart>
```

### 9. Candlestick

```tsx
import { CandlestickChart } from "graphene-charts";

const ohlc = [
  { date: "2025-01-02", open: 148.2, high: 152.1, low: 147.5, close: 151.0 },
  { date: "2025-01-03", open: 151.0, high: 153.4, low: 149.8, close: 149.9 },
  // ...
];

<CandlestickChart data={ohlc} aspectRatio="3 / 1" />
```

### 10. Waterfall

```tsx
import { WaterfallChart } from "graphene-charts";

const data = [
  { name: "Revenue",    value: 420, type: "total" },
  { name: "COGS",       value: -110 },
  { name: "Gross",      value: 310, type: "total" },
  { name: "Expenses",   value: -95 },
  { name: "Net",        value: 215, type: "total" },
];

<WaterfallChart data={data} aspectRatio="3 / 1" showValues />
```

### 11. Treemap

```tsx
import { TreemapChart } from "graphene-charts";

const data = {
  name: "Revenue",
  children: [
    { name: "Product A", value: 420, color: "#8b5cf6" },
    { name: "Product B", value: 310, color: "#06b6d4" },
    { name: "Product C", value: 185, color: "#10b981" },
  ],
};

<TreemapChart data={data} aspectRatio="2 / 1" />
```

### 12. Heatmap Calendar

```tsx
import { HeatmapCalendar } from "graphene-charts";

// Array of { date, value } for up to a year
const contributions = [
  { date: "2025-01-05", value: 4 },
  { date: "2025-01-06", value: 7 },
  // ...
];

<HeatmapCalendar data={contributions} colorFrom="rgba(16,185,129,0.2)" colorTo="#10b981" />
```

### 13. Timeline / Gantt

```tsx
import { TimelineChart } from "graphene-charts";

const items = [
  { id: "1", label: "Discovery",  start: "2025-01-06", end: "2025-01-24", group: "Phase 1", color: "#8b5cf6" },
  { id: "2", label: "Design",     start: "2025-01-20", end: "2025-02-14", group: "Design",  color: "#06b6d4" },
  { id: "3", label: "Dev",        start: "2025-02-03", end: "2025-03-28", group: "Backend", color: "#10b981" },
];

<TimelineChart items={items} barHeight={22} />
```

### 14. Network Graph

```tsx
import { NetworkGraph } from "graphene-charts";

const nodes = [
  { id: "api",  label: "API",      size: 16, group: "core"   },
  { id: "db",   label: "Database", size: 14, group: "core"   },
  { id: "web",  label: "Web",      size: 12, group: "client" },
];

const edges = [
  { source: "web", target: "api", weight: 2 },
  { source: "api", target: "db",  weight: 2 },
];

<NetworkGraph
  nodes={nodes}
  edges={edges}
  aspectRatio="1 / 1"
  chargeStrength={-120}
  linkDistance={60}
  showLabels
/>
```

Nodes are draggable — click and drag to reposition them; the force simulation reacts in real time.

### 15. Mermaid Diagrams

```tsx
import { MermaidDiagram } from "graphene-charts";

<MermaidDiagram chart={`
  flowchart LR
    A([User]) --> B[Web App]
    B --> C{Auth?}
    C -->|yes| D[API]
    C -->|no| E[Login]
    D --> F[(Database)]
`} />

<MermaidDiagram chart={`
  sequenceDiagram
    participant U as User
    participant A as API
    U->>A: GET /data
    A-->>U: 200 OK
`} />
```

Supports all Mermaid diagram types: flowchart, sequence, class, state, ER, Gantt, pie, git, and more.

### 16. Statistical charts

```tsx
import { BoxPlotChart, ViolinPlotChart } from "graphene-charts";

// Box plot
const boxData = [
  { label: "Jan", min: 12, q1: 28, median: 45, q3: 62, max: 88, outliers: [5, 95] },
  { label: "Feb", min: 18, q1: 35, median: 52, q3: 70, max: 92 },
];
<BoxPlotChart data={boxData} aspectRatio="2 / 1" />

// Violin plot (pass raw values — KDE is computed automatically)
const violinData = [
  { label: "Group A", values: [12, 34, 45, 67, 23, 89, 45, 56, 34, 78] },
  { label: "Group B", values: [55, 60, 58, 62, 54, 65, 59, 57, 61, 63] },
];
<ViolinPlotChart data={violinData} aspectRatio="2 / 1" showMedian showQuartiles />
```

### 17. Bubble chart

```tsx
import { BubbleChart } from "graphene-charts";

// Single series
const data = [
  { x: 20, y: 30, size: 15, label: "Alpha" },
  { x: 45, y: 60, size: 40, label: "Beta" },
];

// Multi-series (array of arrays)
const multiSeries = [
  [ { x: 20, y: 30, size: 15 }, { x: 45, y: 60, size: 40 } ],
  [ { x: 70, y: 25, size: 20 }, { x: 35, y: 80, size: 55 } ],
];

<BubbleChart data={multiSeries} xLabel="Engagement" yLabel="Retention" fillOpacity={0.65} />
```

### 18. Sunburst

```tsx
import { SunburstChart } from "graphene-charts";

const data = {
  name: "Budget",
  children: [
    {
      name: "Engineering", color: "#8b5cf6",
      children: [
        { name: "Frontend", value: 120 },
        { name: "Backend",  value: 140 },
      ],
    },
    { name: "Marketing", color: "#06b6d4", value: 95 },
  ],
};

<SunburstChart data={data} size={360} />

// Donut variant
<SunburstChart data={data} size={360} innerRadius={50} />
```

---

## Radar chart

```tsx
import { RadarChart, RadarArea, RadarAxis, RadarGrid, RadarLabels } from "graphene-charts";

const metrics = [
  { key: "speed",       label: "Speed"       },
  { key: "reliability", label: "Reliability" },
  { key: "comfort",     label: "Comfort"     },
];

const series = [
  { label: "Product A", color: "#8b5cf6", values: { speed: 85, reliability: 90, comfort: 70 } },
  { label: "Product B", color: "#06b6d4", values: { speed: 65, reliability: 80, comfort: 88 } },
];

<RadarChart data={series} metrics={metrics}>
  <RadarGrid />
  <RadarAxis />
  <RadarLabels />
  <RadarArea index={0} />
  <RadarArea index={1} />
</RadarChart>
```

---

## Sankey / Flow

```tsx
import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip } from "graphene-charts";

const data = {
  nodes: [
    { name: "Visitors", category: "source" },
    { name: "Signups",  category: "landing" },
    { name: "Paying",   category: "outcome" },
  ],
  links: [
    { source: 0, target: 1, value: 3200 },
    { source: 1, target: 2, value: 420  },
  ],
};

<SankeyChart data={data} aspectRatio="3 / 1">
  <SankeyLink strokeOpacity={0.4} />
  <SankeyNode />
  <SankeyTooltip />
</SankeyChart>
```

---

## Responsive sizing

Every chart is responsive by default — it measures its container and re-renders when resized. To use a fixed size, pass `size` (square charts) or `aspectRatio`:

```tsx
// Fills container width, 2:1 aspect ratio (default for most charts)
<LineChart data={data} xDataKey="date" aspectRatio="2 / 1">...</LineChart>

// Fixed 400×400 px
<PieChart data={data} size={400}>...</PieChart>
```

> **Tip:** If a chart refuses to shrink when you resize the window, ensure its parent container has `overflow: hidden` and, if inside a CSS grid, `min-width: 0`.

---

## Animation

All charts animate on mount. You can customize the enter transition on supported charts:

```tsx
<LineChart
  data={data}
  xDataKey="date"
  enterTransition={{ type: "spring", stiffness: 120, damping: 20 }}
  enterStaggerScale={1.5}
>
  ...
</LineChart>
```

To replay the enter animation (e.g. after data changes), change the `revealSignature` prop:

```tsx
<BarChart data={data} xDataKey="name" revealSignature={String(dataVersion)}>
  ...
</BarChart>
```

---

## Running the demo

```bash
git clone https://github.com/yourusername/graphene-charts
cd graphene-charts
npm install
cd demo && npm install
npm run dev     # opens http://localhost:5173
```

The demo showcases every chart type with realistic data and interactive examples.

---

## Building from source

```bash
npm run build     # outputs ESM + CJS + types to dist/
npm run typecheck # tsc --noEmit
```

---

## Tech stack

| Package | Role |
|---|---|
| `@visx/*` | SVG primitives, scales, axes, hierarchy, heatmap, network |
| `d3-shape` / `d3-force` / `d3-scale` | Layout, path generation, force simulation |
| `motion/react` (Framer Motion) | Spring animations, enter transitions |
| `react-use-measure` | Responsive container measurement |
| `mermaid` | Text-to-diagram rendering |
| `d3-interpolate` | Color interpolation for heatmap |

---

## License

MIT
