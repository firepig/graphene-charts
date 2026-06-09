import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";
import { cn } from "../lib/utils";

export interface MermaidThemeVariables {
  background?: string;
  primaryColor?: string;
  primaryTextColor?: string;
  primaryBorderColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  edgeLabelBackground?: string;
  clusterBkg?: string;
  titleColor?: string;
  nodeBorder?: string;
  mainBkg?: string;
  nodeTextColor?: string;
  [key: string]: string | undefined;
}

export interface MermaidDiagramProps {
  /** Mermaid diagram definition string */
  chart: string;
  /**
   * Mermaid base theme. Default: "dark".
   * One of: "dark" | "default" | "neutral" | "forest" | "base"
   */
  mermaidTheme?: string;
  /** Fine-grained overrides applied on top of the base theme */
  themeVariables?: MermaidThemeVariables;
  /** Additional CSS class */
  className?: string;
  /** Background color. Default: "transparent" */
  background?: string;
}

let _renderCount = 0;

export function MermaidDiagram({
  chart,
  mermaidTheme = "dark",
  themeVariables,
  className,
  background = "transparent",
}: MermaidDiagramProps) {
  const rawId = useId();
  const stableId = `mermaid-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      // Re-initialize before every render so theme changes take effect.
      // mermaid.initialize is synchronous and cheap.
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme as Parameters<typeof mermaid.initialize>[0]["theme"],
        themeVariables: themeVariables ?? {},
        flowchart: { curve: "basis", htmlLabels: true },
        securityLevel: "loose",
      });

      const renderId = `mermaid-render-${++_renderCount}`;
      try {
        const { svg } = await mermaid.render(renderId, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        }
      } catch (e) {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre style="color:var(--chart-down,#ef4444);font-size:12px">${String(e)}</pre>`;
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart, mermaidTheme, themeVariables, stableId]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-auto", className)}
      style={{ background }}
    />
  );
}

MermaidDiagram.displayName = "MermaidDiagram";
