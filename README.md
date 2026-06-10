# Graphene Charts

> Production-grade animated React chart library built on [@visx](https://airbnb.io/visx/), [D3](https://d3js.org/), and [Motion](https://motion.dev/). Dark-theme-first, zero shadcn/ui dependency, fully typed.

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
- **Animated entry** — Motion spring/tween transitions with configurable stagger
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

## CSS setup

Graphene Charts ships two CSS files. You always need `themes.css` for the color palette. How you get the layout styles depends on whether your project uses Tailwind.

### Option A — No Tailwind (recommended for most projects)

Import the pre-compiled stylesheet. This includes all Tailwind utilities the library needs, compiled into a standalone 16 KB file. No Tailwind config required.

```tsx
// main.tsx / entry file
import "graphene-charts/styles.css";  // compiled layout + utility styles
import "graphene-charts/themes.css";  // color palette (gc-dark, gc-light, etc.)
```

### Option B — With Tailwind v4

Tell Tailwind to scan Graphene's source so it generates all the utility classes the components use. Import only the themes file (Tailwind handles the rest).

```css
/* your main.css */
@import "tailwindcss";
@source "./node_modules/graphene-charts/src";   /* scan library source */
```

```tsx
// main.tsx / entry file
import "graphene-charts/themes.css";  // color palette only — Tailwind provides the rest
```

### With Tailwind v3

```js
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/graphene-charts/src/**/*.{ts,tsx}",
  ],
  // ...
};
```

```tsx
import "graphene-charts/themes.css";
```

---

## Themes

Apply a theme class to any ancestor element (or `<html>`) to activate that palette. All chart components read exclusively from CSS variables, so swapping the class re-skins every chart at once.

```tsx
// In your root layout or App.tsx:
useEffect(() => {
  document.documentElement.className = "gc-dark";
}, []);

// Or directly on a container:
<div className="gc-dark">
  {/* charts */}
</div>
```

| Class | Description |
|---|---|
| `gc-dark` | Dark violet — default |
| `gc-light` | Light mode, same violet palette |
| `gc-ocean` | Deep blue palette |
| `gc-rose` | Warm rose / amber |
| `gc-cyberpunk` | High-contrast neon |
| `gc-mono` | Monochrome |

**Custom theme** — override any variable on any element:

```css
.my-theme {
  --chart-1: #ff6b35;
  --chart-2: #06b6d4;
  --chart-foreground: #f0f6fc;
  --chart-surface: #0d1117;
  --chart-label: #64748b;
  --chart-grid: rgba(255,255,255,0.06);
  --chart-tooltip-background: rgba(13,17,23,0.95);
}
```

---

## Quickstart

### Bar chart

```tsx
import { BarChart, Bar, BarXAxis, BarChartTooltip } from "graphene-charts";

const data = [
  { name: "Jan", revenue: 120 },
  { name: "Feb", revenue: 145 },
  { name: "Mar", revenue: 98  },
];

<BarChart data={data} xDataKey="name" aspectRatio="2 / 1">
  <BarXAxis />
  <Bar dataKey="revenue" fill="var(--chart-1)" lineCap={4} />
  <BarChartTooltip />
</BarChart>
```

**`BarChartTooltip`** is a zero-config drop-in — add it as a child and it automatically reads hover state from the chart context, shows an animated tooltip panel, and handles edge-flip (tooltip flips side when near the chart boundary).

```tsx
// Custom value formatting:
<BarChartTooltip formatValue={(v, key) => `$${v.toLocaleString()}`} />

// Custom title:
<BarChartTooltip title={(label) => `${label} stats`} />
```

Grouped and stacked bars:

```tsx
const data = [{ name: "Jan", a: 30, b: 105 }, { name: "Feb", a: 120, b: 38 }];

// Grouped
<BarChart data={data} xDataKey="name">
  <BarXAxis />
  <Bar dataKey="a" fill="var(--chart-1)" />
  <Bar dataKey="b" fill="var(--chart-2)" />
  <BarChartTooltip />
</BarChart>

// Stacked
<BarChart data={data} xDataKey="name" stacked>...</BarChart>

// 100% stacked
<BarChart data={data} xDataKey="name" stacked stackMode="percent">...</BarChart>

// Horizontal
<BarChart data={data} xDataKey="name" orientation="horizontal">...</BarChart>
```

---

### Pie / Donut chart

```tsx
import { PieChart, PieSlice, PieCenter } from "graphene-charts";

const data = [
  { label: "Direct",   value: 38, color: "#8b5cf6" },
  { label: "Organic",  value: 27, color: "#06b6d4" },
  { label: "Referral", value: 20, color: "#10b981" },
];

// Solid pie — PieSlice index is injected automatically
<PieChart data={data} size={300}>
  <PieSlice />
  <PieSlice />
  <PieSlice />
</PieChart>

// Donut with animated center label
<PieChart data={data} size={300} innerRadius={70}>
  <PieSlice />
  <PieSlice />
  <PieSlice />
  <PieCenter defaultLabel="Total" />
</PieChart>

// Donut with custom center (render function for hover-aware content)
<PieChart data={data} size={300} innerRadius={70}>
  <PieSlice />
  <PieSlice />
  <PieSlice />
  <PieCenter>
    {({ isHovered, data: hovered, value, label }) => (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          {isHovered ? hovered.value : value}
        </div>
        <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
          {isHovered ? hovered.label : label}
        </div>
      </div>
    )}
  </PieCenter>
</PieChart>
```

> **Note:** `<PieSlice />` does not require an `index` prop — the parent `PieChart` auto-injects the correct index based on order. Explicit `index` props are still accepted as an override.

---

### Line chart

```tsx
import { LineChart, Line, Grid, XAxis, YAxis } from "graphene-charts";

const data = [
  { date: new Date("2025-01-01"), revenue: 120, sessions: 85 },
  { date: new Date("2025-02-01"), revenue: 145, sessions: 92 },
  { date: new Date("2025-03-01"), revenue: 138, sessions: 78 },
];

<LineChart data={data} xDataKey="date" aspectRatio="2 / 1">
  <Grid />
  <XAxis />
  <YAxis />
  <Line dataKey="revenue"  stroke="var(--chart-1)" strokeWidth={2} />
  <Line dataKey="sessions" stroke="var(--chart-2)" strokeWidth={2} />
</LineChart>
```

---

### Area chart

```tsx
import { AreaChart, Area, Grid, XAxis, YAxis } from "graphene-charts";

<AreaChart data={data} xDataKey="date" stacked aspectRatio="2 / 1">
  <Grid />
  <XAxis />
  <YAxis />
  <Area dataKey="revenue"  fill="var(--chart-1)" fillOpacity={0.5} stroke="var(--chart-1)" />
  <Area dataKey="sessions" fill="var(--chart-2)" fillOpacity={0.5} stroke="var(--chart-2)" />
</AreaChart>
```

---

### Gauge

```tsx
import { Gauge } from "graphene-charts";

// With a 0–100 percentage value
<Gauge value={72} width={220} height={220} suffix="%" defaultLabel="Uptime" />

// With a raw value and a max (e.g. 263 out of 300 seconds)
<Gauge value={263} max={300} width={220} height={220} suffix=" sec" defaultLabel="Duration" />
```

---

### Custom tooltips (advanced)

For charts other than `BarChart`, wire up a tooltip manually using the primitives:

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
          {
            color: "var(--chart-1)",
            label: "Revenue",
            value: tooltipData?.point?.["revenue"] as number,
          },
        ]}
      />
    </TooltipBox>
  );
}

<LineChart data={data} xDataKey="date">
  <Line dataKey="revenue" stroke="var(--chart-1)" />
  <MyTooltip />
</LineChart>
```

---

### Legend

```tsx
import { ChartLegend } from "graphene-charts";

<ChartLegend
  items={[
    { label: "Revenue", value: 1420, color: "var(--chart-1)" },
    { label: "Sessions", value: 830,  color: "var(--chart-2)" },
  ]}
  showValue
/>
```

---

### Pattern fills

```tsx
import { PatternLines, PatternCircles } from "graphene-charts";

<BarChart data={data} xDataKey="name">
  <PatternLines id="hatch" height={6} width={6} stroke="var(--chart-1)" strokeWidth={1.5} />
  <Bar dataKey="a" fill="url(#hatch)" stroke="var(--chart-1)" />
</BarChart>
```

---

### Other chart types

<details>
<summary>Candlestick</summary>

```tsx
import { CandlestickChart } from "graphene-charts";

const ohlc = [
  { date: "2025-01-02", open: 148.2, high: 152.1, low: 147.5, close: 151.0 },
  { date: "2025-01-03", open: 151.0, high: 153.4, low: 149.8, close: 149.9 },
];

<CandlestickChart data={ohlc} aspectRatio="3 / 1" />
```
</details>

<details>
<summary>Waterfall</summary>

```tsx
import { WaterfallChart } from "graphene-charts";

const data = [
  { name: "Revenue",  value: 420, type: "total" },
  { name: "COGS",     value: -110 },
  { name: "Gross",    value: 310, type: "total" },
  { name: "Expenses", value: -95 },
  { name: "Net",      value: 215, type: "total" },
];

<WaterfallChart data={data} aspectRatio="3 / 1" showValues />
```
</details>

<details>
<summary>Treemap</summary>

```tsx
import { TreemapChart } from "graphene-charts";

const data = {
  name: "Revenue",
  children: [
    { name: "Product A", value: 420, color: "#8b5cf6" },
    { name: "Product B", value: 310, color: "#06b6d4" },
  ],
};

<TreemapChart data={data} aspectRatio="2 / 1" />
```
</details>

<details>
<summary>Radar</summary>

```tsx
import { RadarChart, RadarArea, RadarAxis, RadarGrid, RadarLabels } from "graphene-charts";

const metrics = [
  { key: "speed",       label: "Speed"       },
  { key: "reliability", label: "Reliability" },
  { key: "comfort",     label: "Comfort"     },
];

const series = [
  { label: "A", color: "#8b5cf6", values: { speed: 85, reliability: 90, comfort: 70 } },
  { label: "B", color: "#06b6d4", values: { speed: 65, reliability: 80, comfort: 88 } },
];

<RadarChart data={series} metrics={metrics}>
  <RadarGrid />
  <RadarAxis />
  <RadarLabels />
  <RadarArea index={0} />
  <RadarArea index={1} />
</RadarChart>
```
</details>

<details>
<summary>Heatmap Calendar</summary>

```tsx
import { HeatmapCalendar } from "graphene-charts";

<HeatmapCalendar
  data={[
    { date: "2025-01-05", value: 4 },
    { date: "2025-01-06", value: 7 },
  ]}
  colorFrom="rgba(16,185,129,0.2)"
  colorTo="#10b981"
/>
```
</details>

<details>
<summary>Sankey / Flow</summary>

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
</details>

<details>
<summary>Network Graph</summary>

```tsx
import { NetworkGraph } from "graphene-charts";

<NetworkGraph
  nodes={[
    { id: "api", label: "API",      size: 16, group: "core"   },
    { id: "db",  label: "Database", size: 14, group: "core"   },
    { id: "web", label: "Web",      size: 12, group: "client" },
  ]}
  edges={[
    { source: "web", target: "api", weight: 2 },
    { source: "api", target: "db",  weight: 2 },
  ]}
  aspectRatio="1 / 1"
  chargeStrength={-120}
  linkDistance={60}
  showLabels
/>
```

Nodes are draggable — the force simulation reacts in real time.
</details>

<details>
<summary>Mermaid Diagrams</summary>

```tsx
import { MermaidDiagram } from "graphene-charts";

<MermaidDiagram chart={`
  flowchart LR
    A([User]) --> B[Web App]
    B --> C{Auth?}
    C -->|yes| D[API]
    C -->|no|  E[Login]
    D --> F[(Database)]
`} />
```

Supports all Mermaid diagram types: flowchart, sequence, class, state, ER, Gantt, pie, git, and more.
</details>

---

## Responsive sizing

Every chart fills its container by default. Use `aspectRatio` to control shape, or `size` for fixed square charts:

```tsx
// Fills container, 2:1 ratio
<LineChart data={data} xDataKey="date" aspectRatio="2 / 1">...</LineChart>

// Fixed 400×400
<PieChart data={data} size={400}>...</PieChart>
```

> **Tip:** If a chart refuses to shrink when you resize the window, ensure its parent has `overflow: hidden` and, inside a CSS grid, `min-width: 0`.

---

## Animation

All charts animate on mount. Customize the enter transition on any supported chart:

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

To replay the enter animation (e.g. after a data refresh), change `revealSignature`:

```tsx
<BarChart data={data} xDataKey="name" revealSignature={String(dataVersion)}>
  ...
</BarChart>
```

---

## Running the demo

```bash
git clone https://github.com/firepig/graphene-charts
cd graphene-charts
npm install --legacy-peer-deps
cd demo && npm install
npm run dev     # opens http://localhost:5173
```

The demo showcases every chart type with realistic data and interactive controls.

---

## Building from source

```bash
npm run build     # ESM + CJS + types → dist/ + compiles dist/styles.css via Tailwind
npm run typecheck # tsc --noEmit
```

The build emits:
- `dist/index.js` / `dist/index.cjs` — ESM and CJS bundles
- `dist/index.d.ts` — TypeScript declarations
- `dist/themes.css` — CSS custom property palette (always import this)
- `dist/styles.css` — pre-compiled Tailwind utilities (import this if you don't use Tailwind)

---

## Tech stack

| Package | Role |
|---|---|
| `@visx/*` | SVG primitives, scales, axes, hierarchy, heatmap, network |
| `d3-shape` / `d3-force` / `d3-scale` | Layout, path generation, force simulation |
| `motion` (Motion for React) | Spring animations, enter transitions |
| `react-use-measure` | Responsive container measurement |
| `mermaid` | Text-to-diagram rendering |
| `tailwindcss` (dev only) | Utility classes compiled to `dist/styles.css` at build time |

---

## License

MIT
