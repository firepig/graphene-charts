import React, { useCallback, useEffect, useRef, useState } from "react";
import { BarChart } from "../../src/charts/bar-chart";
import { Bar } from "../../src/charts/bar";
import { BarYAxis } from "../../src/charts/bar-y-axis";
import { PieChart } from "../../src/charts/pie-chart";
import { PieSlice } from "../../src/charts/pie-slice";
import { LineChart } from "../../src/charts/line-chart";
import { Line } from "../../src/charts/line";
import { WaterfallChart } from "../../src/charts/waterfall-chart";

// ─── Variable schema ──────────────────────────────────────────────────────────

interface VarMeta {
  key: string;
  label: string;
  hint?: string;
}
interface VarGroup {
  label: string;
  vars: VarMeta[];
}

const VAR_GROUPS: VarGroup[] = [
  {
    label: "Series palette",
    vars: [
      { key: "--chart-1", label: "Series 1" },
      { key: "--chart-2", label: "Series 2" },
      { key: "--chart-3", label: "Series 3" },
      { key: "--chart-4", label: "Series 4" },
      { key: "--chart-5", label: "Series 5" },
    ],
  },
  {
    label: "Direction",
    vars: [
      { key: "--chart-up",      label: "Up / Gain",   hint: "Bullish / positive delta" },
      { key: "--chart-down",    label: "Down / Loss",  hint: "Bearish / negative delta" },
      { key: "--chart-neutral", label: "Neutral",      hint: "Totals, neutral state" },
    ],
  },
  {
    label: "Surfaces",
    vars: [
      { key: "--chart-surface",        label: "Background" },
      { key: "--chart-surface-raised", label: "Card surface" },
      { key: "--chart-border",         label: "Border" },
    ],
  },
  {
    label: "Text",
    vars: [
      { key: "--chart-foreground",       label: "Foreground" },
      { key: "--chart-foreground-muted", label: "Muted text" },
      { key: "--chart-label",            label: "Axis labels" },
    ],
  },
  {
    label: "Lines & overlays",
    vars: [
      { key: "--chart-grid",           label: "Gridlines",     hint: "rgba for subtlety" },
      { key: "--chart-axis",           label: "Axis lines",    hint: "rgba for subtlety" },
      { key: "--chart-overlay",        label: "Overlay",       hint: "Median / whiskers" },
      { key: "--chart-crosshair",      label: "Crosshair",     hint: "rgba for subtlety" },
      { key: "--chart-line-primary",   label: "Primary line" },
      { key: "--chart-line-secondary", label: "Secondary line" },
    ],
  },
  {
    label: "Tooltip",
    vars: [
      { key: "--chart-tooltip-background", label: "Background", hint: "rgba for glass effect" },
      { key: "--chart-tooltip-foreground", label: "Text" },
      { key: "--chart-tooltip-muted",      label: "Muted text" },
    ],
  },
];

const ALL_KEYS = VAR_GROUPS.flatMap((g) => g.vars.map((v) => v.key));

export type VarMap = Record<string, string>;

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESET_CLASSES = [
  { id: "gc-dark",       label: "Dark" },
  { id: "gc-light",      label: "Light" },
  { id: "gc-ocean",      label: "Ocean" },
  { id: "gc-rose",       label: "Rose" },
  { id: "gc-cyberpunk",  label: "Cyberpunk" },
  { id: "gc-mono",       label: "Mono" },
  { id: "gc-mono-light", label: "Mono Light" },
];

/** Read all --chart-* CSS vars from an element bearing the given theme class. */
function readVarsFromClass(className: string): VarMap {
  const el = document.createElement("div");
  el.className = className;
  Object.assign(el.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    width: "1px",
    height: "1px",
  });
  document.body.appendChild(el);
  const style = getComputedStyle(el);
  const result: VarMap = {};
  for (const key of ALL_KEYS) {
    result[key] = style.getPropertyValue(key).trim();
  }
  document.body.removeChild(el);
  return result;
}

/** Convert any CSS color to "#rrggbb" for use with <input type="color">. */
function toHex(val: string): string {
  const v = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v))
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map((n) => parseInt(n).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return "#000000";
}

/** True when the value is a simple hex color (no alpha channel). */
function isSimpleHex(val: string): boolean {
  return /^#[0-9a-fA-F]{3,6}$/.test(val.trim());
}

/** Build the .gc-custom { … } CSS block. */
export function generateCSS(vars: VarMap, className = "gc-custom"): string {
  const lines = ALL_KEYS.map((k) => `  ${k}: ${vars[k] ?? ""};`).join("\n");
  return `.${className} {\n${lines}\n}`;
}

// ─── Preview data (stable — not inside component) ────────────────────────────

const PREV_BAR = [
  { name: "A", a: 80, b: 55 },
  { name: "B", a: 120, b: 85 },
  { name: "C", a: 65, b: 100 },
  { name: "D", a: 145, b: 75 },
];

const PREV_PIE = [
  { label: "Alpha", value: 40, color: "var(--chart-1)" },
  { label: "Beta",  value: 25, color: "var(--chart-2)" },
  { label: "Gamma", value: 20, color: "var(--chart-3)" },
  { label: "Delta", value: 15, color: "var(--chart-4)" },
];

const PREV_LINE = (() => {
  const d: { date: Date; a: number; b: number }[] = [];
  const base = new Date("2025-01-01");
  for (let i = 0; i < 10; i++) {
    d.push({
      date: new Date(base.getTime() + i * 30 * 86400_000),
      a: 30 + Math.sin(i * 0.7) * 18 + i * 3,
      b: 50 + Math.cos(i * 0.5) * 14 + i * 2,
    });
  }
  return d;
})();

const PREV_WATERFALL = [
  { name: "Revenue", value: 420, type: "total" as const },
  { name: "COGS",    value: -110 },
  { name: "Gross",   value: 310, type: "total" as const },
  { name: "R&D",     value: -65 },
  { name: "Net",     value: 245, type: "total" as const },
];

// ─── Main component ───────────────────────────────────────────────────────────

export interface ThemeCreatorProps {
  isOpen: boolean;
  currentThemeClass: string;
  onClose: () => void;
  /** Called when user clicks "Apply to Demo". Receives the final VarMap. */
  onApply: (vars: VarMap) => void;
}

export function ThemeCreator({
  isOpen,
  currentThemeClass,
  onClose,
  onApply,
}: ThemeCreatorProps) {
  const [vars, setVars] = useState<VarMap>({});
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Bootstrap from the current theme whenever the panel opens
  useEffect(() => {
    if (isOpen) {
      setVars(readVarsFromClass(currentThemeClass));
    }
  }, [isOpen, currentThemeClass]);

  // Apply all vars to the preview container via setProperty so CSS vars cascade
  useEffect(() => {
    const el = previewRef.current;
    if (!el || Object.keys(vars).length === 0) return;
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value);
    }
  }, [vars]);

  const setVar = useCallback((key: string, value: string) => {
    setVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  function loadPreset(id: string) {
    setVars(readVarsFromClass(id));
  }

  const css = generateCSS(vars);

  function handleCopy() {
    navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          width: "min(780px, 100vw)",
          background: "var(--chart-surface-raised)",
          borderLeft: "1px solid var(--chart-border)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderBottom: "1px solid var(--chart-border)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "var(--chart-foreground)",
              flex: 1,
            }}
          >
            Theme Creator
          </span>

          <label
            style={{
              fontSize: 11,
              color: "var(--chart-foreground-muted)",
              marginRight: 2,
            }}
          >
            Start from
          </label>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) loadPreset(e.target.value);
            }}
            style={{
              background: "var(--chart-surface)",
              color: "var(--chart-foreground)",
              border: "1px solid var(--chart-border)",
              borderRadius: 8,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="" disabled>
              preset…
            </option>
            {PRESET_CLASSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--chart-border)",
              color: "var(--chart-foreground-muted)",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: editor + preview ─────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left: variable editor */}
          <div
            style={{
              width: 300,
              borderRight: "1px solid var(--chart-border)",
              overflowY: "auto",
              padding: "14px 16px",
              flexShrink: 0,
            }}
          >
            {VAR_GROUPS.map((group) => (
              <div key={group.label} style={{ marginBottom: 22 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--chart-foreground-muted)",
                    marginBottom: 10,
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--chart-border)",
                  }}
                >
                  {group.label}
                </div>
                {group.vars.map((v) => (
                  <VarRow
                    key={v.key}
                    meta={v}
                    value={vars[v.key] ?? ""}
                    onChange={setVar}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Right: preview + CSS export */}
          <div
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Preview area — all vars are injected here via useEffect + setProperty */}
            <div
              ref={previewRef}
              style={{ flex: 1, overflowY: "auto", padding: 16 }}
            >
              <SectionLabel>Palette</SectionLabel>
              <PaletteStrip />

              <div style={{ height: 16 }} />

              <SectionLabel>Charts</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <PreviewCard label="Bar">
                  <BarChart data={PREV_BAR} aspectRatio="2 / 1">
                    <BarYAxis />
                    <Bar dataKey="a" fill="var(--chart-1)" />
                    <Bar dataKey="b" fill="var(--chart-2)" />
                  </BarChart>
                </PreviewCard>

                <PreviewCard label="Pie">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <PieChart data={PREV_PIE} size={130}>
                      {PREV_PIE.map((d, i) => (
                        <PieSlice key={d.label} index={i} fill={d.color} />
                      ))}
                    </PieChart>
                  </div>
                </PreviewCard>
              </div>

              <PreviewCard label="Line">
                <LineChart data={PREV_LINE} xDataKey="date" aspectRatio="3 / 1">
                  <Line dataKey="a" stroke="var(--chart-line-primary)" />
                  <Line dataKey="b" stroke="var(--chart-line-secondary)" />
                </LineChart>
              </PreviewCard>

              <div style={{ height: 12 }} />

              <PreviewCard label="Waterfall (up / down / neutral)">
                <WaterfallChart data={PREV_WATERFALL} aspectRatio="3 / 1" />
              </PreviewCard>

              <div style={{ height: 20 }} />

              <SectionLabel>Generated CSS</SectionLabel>
              <pre
                style={{
                  fontSize: 11,
                  lineHeight: 1.65,
                  color: "var(--chart-foreground)",
                  background: "var(--chart-surface)",
                  border: "1px solid var(--chart-border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  overflowX: "auto",
                  fontFamily: "monospace",
                  margin: 0,
                }}
              >
                {css}
              </pre>

              {/* bottom breathing room */}
              <div style={{ height: 20 }} />
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 16px",
                borderTop: "1px solid var(--chart-border)",
                flexShrink: 0,
                background: "var(--chart-surface-raised)",
              }}
            >
              <button
                onClick={handleCopy}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid var(--chart-border)",
                  color: "var(--chart-foreground)",
                  borderRadius: 8,
                  padding: "9px 0",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy CSS"}
              </button>
              <button
                onClick={() => onApply(vars)}
                style={{
                  flex: 1,
                  background: "var(--chart-1)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "9px 0",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Apply to Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--chart-foreground-muted)",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function PreviewCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--chart-surface-raised)",
        border: "1px solid var(--chart-border)",
        borderRadius: 8,
        padding: "10px 12px 8px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--chart-label)",
          marginBottom: 6,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** A row of color swatches showing the live palette. */
function PaletteStrip() {
  const series = ["--chart-1","--chart-2","--chart-3","--chart-4","--chart-5"];
  const direction = ["--chart-up","--chart-down","--chart-neutral"];
  const surfaces = ["--chart-surface","--chart-surface-raised","--chart-border"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SwatchRow keys={series} label="Series" />
      <SwatchRow keys={direction} label="Direction" />
      <SwatchRow keys={surfaces} label="Surfaces" />
    </div>
  );
}

function SwatchRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--chart-foreground-muted)",
          width: 60,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {keys.map((k) => (
        <div
          key={k}
          title={k}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: `var(${k})`,
            border: "1px solid var(--chart-border)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── VarRow ───────────────────────────────────────────────────────────────────

interface VarRowProps {
  meta: VarMeta;
  value: string;
  onChange: (key: string, value: string) => void;
}

function VarRow({ meta, value, onChange }: VarRowProps) {
  const usePicker = isSimpleHex(value);
  const hexVal = toHex(value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      {/* Color swatch / picker */}
      <label
        title={usePicker ? "Click to pick color" : "Edit value directly"}
        style={{
          position: "relative",
          flexShrink: 0,
          cursor: usePicker ? "pointer" : "default",
          lineHeight: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: value || "transparent",
            border: "1px solid var(--chart-border)",
          }}
        />
        {usePicker && (
          <input
            type="color"
            value={hexVal}
            onChange={(e) => onChange(meta.key, e.target.value)}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
            }}
          />
        )}
      </label>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--chart-foreground)",
            lineHeight: 1.2,
            marginBottom: 3,
          }}
        >
          {meta.label}
          {meta.hint && (
            <span
              style={{
                fontSize: 9,
                color: "var(--chart-foreground-muted)",
                marginLeft: 5,
              }}
            >
              {meta.hint}
            </span>
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(meta.key, e.target.value)}
          spellCheck={false}
          style={{
            width: "100%",
            fontSize: 10,
            fontFamily: "monospace",
            background: "var(--chart-surface)",
            color: "var(--chart-foreground-muted)",
            border: "1px solid var(--chart-border)",
            borderRadius: 4,
            padding: "2px 6px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
