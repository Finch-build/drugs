import type { CSSProperties } from "react";
import type { PatternKind, SeriesDef } from "./types";

export function swatchStyle(color: string, pattern: PatternKind = "solid"): CSSProperties {
  if (pattern === "hatch") return { background: `repeating-linear-gradient(45deg, ${color} 0 3px, var(--bg) 3px 5px)`, borderColor: color };
  if (pattern === "dots") return { background: `radial-gradient(var(--bg) 1.2px, ${color} 1.4px) 0 0 / 5px 5px`, borderColor: color };
  return { background: color, borderColor: color };
}

export function Legend({ series, label = "Legend" }: { series: SeriesDef[]; label?: string }) {
  return (
    <ul className="chart-legend" aria-label={label}>
      {series.map((s) => (
        <li key={s.key}>
          <span className="chart-legend__swatch" style={swatchStyle(s.color, s.pattern)} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export function patternId(prefix: string, key: string): string {
  return `${prefix}-${key}`.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function PatternDefs({ prefix, series }: { prefix: string; series: SeriesDef[] }) {
  return (
    <defs>
      {series
        .filter((s) => s.pattern && s.pattern !== "solid")
        .map((s) => (
          <pattern key={s.key} id={patternId(prefix, s.key)} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: s.color }} />
            {s.pattern === "hatch" ? (
              <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: "var(--bg)", strokeWidth: 2 }} />
            ) : (
              <circle cx="3" cy="3" r="1.2" style={{ fill: "var(--bg)" }} />
            )}
          </pattern>
        ))}
    </defs>
  );
}

export function seriesFill(prefix: string, s: SeriesDef): string {
  return s.pattern && s.pattern !== "solid" ? `url(#${patternId(prefix, s.key)})` : s.color;
}
