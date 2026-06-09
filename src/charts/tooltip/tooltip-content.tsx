import type { ReactNode } from "react";
import { intFmt } from "../chart-formatters";

export interface TooltipRow {
  color: string;
  label: string;
  value: string | number;
}

export interface TooltipContentProps {
  title?: string;
  rows: TooltipRow[];
  children?: ReactNode;
}

export function TooltipContent({ title, rows, children }: TooltipContentProps) {
  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ padding: "10px 12px" }}>
        {title && (
          <div
            style={{
              marginBottom: 8,
              fontWeight: 500,
              fontSize: 12,
              color: "var(--chart-tooltip-foreground, #f1f5f9)",
            }}
          >
            {title}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row) => (
            <div
              key={`${row.label}-${row.color}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: row.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--chart-tooltip-muted, #94a3b8)",
                  }}
                >
                  {row.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--chart-tooltip-foreground, #f1f5f9)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {typeof row.value === "number" ? intFmt(row.value) : row.value}
              </span>
            </div>
          ))}
        </div>
        {children && <div style={{ marginTop: 8 }}>{children}</div>}
      </div>
    </div>
  );
}

TooltipContent.displayName = "TooltipContent";
export default TooltipContent;
