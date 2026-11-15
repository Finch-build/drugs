import { arc as d3arc } from "d3-shape";
import { useId, useState } from "react";
import { formatNumber } from "../ui/format";
import { ChartFrame } from "./ChartFrame";
import { PatternDefs, seriesFill, swatchStyle } from "./Legend";
import { percent, pieLayout } from "./scales";
import type { PatternKind, ValueFormatter } from "./types";

export interface DonutDatum {
  key: string;
  label: string;
  value: number;
  color: string;
  pattern?: PatternKind;
}

export interface DonutChartProps {
  title: string;
  takeaway: string;
  data: DonutDatum[];
  valueLabel: string;
  centerLabel?: string;
  formatValue?: ValueFormatter;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

export function DonutChart({ title, takeaway, data, valueLabel, centerLabel, formatValue = formatNumber, headingLevel, className }: DonutChartProps) {
  const prefix = useId();
  const [active, setActive] = useState<string | null>(null);
  const arcs = pieLayout(data);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const series = data.map((d) => ({ key: d.key, label: d.label, color: d.color, pattern: d.pattern }));
  const activeDatum = data.find((d) => d.key === active);

  return (
    <ChartFrame
      title={title}
      takeaway={takeaway}
      headingLevel={headingLevel}
      className={className}
      columns={["Category", valueLabel, "Share"]}
      rows={data.map((d) => [d.label, formatValue(d.value), percent(d.value, total)])}
    >
      {(width, animate) => {
        const size = Math.max(140, Math.min(220, width));
        const radius = size / 2;
        const shape = d3arc<{ startAngle: number; endAngle: number }>()
          .innerRadius(radius * 0.6)
          .outerRadius(radius - 4)
          .padAngle(0.01);
        return (
          <div className="donut">
            <svg
              width={size}
              height={size}
              viewBox={`${-radius} ${-radius} ${size} ${size}`}
              role="img"
              aria-label={`${title}. Donut chart: ${data.map((d) => `${d.label} ${percent(d.value, total)}`).join(", ")}.`}
              className={`donut__svg ${animate ? "chart--animate" : ""}`}
            >
              <PatternDefs prefix={prefix} series={series} />
              {arcs.map((a, i) => (
                <path
                  key={a.key}
                  d={shape(a) ?? ""}
                  className={`donut__arc ${active && active !== a.key ? "is-dimmed" : ""}`}
                  style={{ fill: seriesFill(prefix, series[i]), animationDelay: `${i * 60}ms` }}
                  onPointerEnter={() => setActive(a.key)}
                  onPointerLeave={() => setActive(null)}
                />
              ))}
              <text textAnchor="middle" dy="-0.2em" className="donut__total">
                {formatValue(activeDatum ? activeDatum.value : total)}
              </text>
              <text textAnchor="middle" dy="1.2em" className="chart-text chart-text--axis">
                {activeDatum ? percent(activeDatum.value, total) : centerLabel ?? "total"}
              </text>
            </svg>
            <ul className="donut__legend" aria-label={`${title} values`}>
              {data.map((d) => (
                <li key={d.key}>
                  <button
                    type="button"
                    className={`donut__item ${active === d.key ? "is-active" : ""}`}
                    onPointerEnter={() => setActive(d.key)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(d.key)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(active === d.key ? null : d.key)}
                    aria-label={`${d.label}: ${formatValue(d.value)} ${valueLabel.toLowerCase()}, ${percent(d.value, total)}`}
                  >
                    <span className="chart-legend__swatch" style={swatchStyle(d.color, d.pattern)} aria-hidden="true" />
                    <span className="donut__label">{d.label}</span>
                    <span className="donut__value" aria-hidden="true">
                      {formatValue(d.value)} · {percent(d.value, total)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      }}
    </ChartFrame>
  );
}
