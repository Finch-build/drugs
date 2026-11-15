import { scaleBand, scaleLinear } from "d3-scale";
import { useId } from "react";
import { formatNumber } from "../ui/format";
import { ChartFrame } from "./ChartFrame";
import { Legend, PatternDefs, seriesFill, swatchStyle } from "./Legend";
import { MarkLayer, type Mark } from "./MarkLayer";
import { niceDomainMax, stackLayout, truncateLabel } from "./scales";
import type { MultiDatum, SeriesDef, ValueFormatter } from "./types";

export interface MultiSeriesChartProps {
  title: string;
  takeaway: string;
  data: MultiDatum[];
  series: SeriesDef[];
  valueLabel: string;
  formatValue?: ValueFormatter;
  height?: number;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  categoryLabel?: string;
}

type Mode = "stacked" | "grouped";

export function StackedBarChart(props: MultiSeriesChartProps) {
  return <MultiSeriesChart {...props} mode="stacked" />;
}

export function GroupedBarChart(props: MultiSeriesChartProps) {
  return <MultiSeriesChart {...props} mode="grouped" />;
}

function MultiSeriesChart({
  title,
  takeaway,
  data,
  series,
  valueLabel,
  formatValue = formatNumber,
  height = 280,
  headingLevel,
  className,
  categoryLabel = "Category",
  mode,
}: MultiSeriesChartProps & { mode: Mode }) {
  const prefix = useId();
  const keys = series.map((s) => s.key);
  const stacked = stackLayout(data, keys);
  const columns = [categoryLabel, ...series.map((s) => s.label), ...(mode === "stacked" ? ["Total"] : [])];
  const rows = stacked.map((row, i) => [
    data[i].label,
    ...row.segments.map((segment) => formatValue(segment.value)),
    ...(mode === "stacked" ? [formatValue(row.total)] : []),
  ]);

  return (
    <ChartFrame
      title={title}
      takeaway={takeaway}
      headingLevel={headingLevel}
      className={className}
      columns={columns}
      rows={rows}
      legend={<Legend series={series} label={`${title} legend`} />}
    >
      {(width, animate) => {
        const margin = { top: 16, right: 8, bottom: 28, left: 48 };
        const plotWidth = Math.max(40, width - margin.left - margin.right);
        const plotHeight = height - margin.top - margin.bottom;
        const x = scaleBand<string>().domain(data.map((d) => d.key)).range([0, plotWidth]).padding(mode === "stacked" ? 0.18 : 0.24);
        const inner = scaleBand<string>().domain(keys).range([0, x.bandwidth()]).padding(0.08);
        const top = mode === "stacked" ? niceDomainMax(stacked.map((r) => r.total)) : niceDomainMax(stacked.flatMap((r) => r.segments.map((s) => s.value)));
        const y = scaleLinear().domain([0, top]).range([plotHeight, 0]);
        const labelEvery = Math.max(1, Math.ceil(40 / Math.max(1, x.step())));
        const fills = new Map(series.map((s) => [s.key, seriesFill(prefix, s)]));
        const groupLabel = (i: number) =>
          `${data[i].label}: ${stacked[i].segments.map((s) => `${series.find((d) => d.key === s.series)?.label} ${formatValue(s.value)}`).join(", ")}${
            mode === "stacked" ? `, total ${formatValue(stacked[i].total)}` : ""
          }`;

        const marks: Mark[] = stacked.map((row, i) => {
          const peak = mode === "stacked" ? row.total : Math.max(0, ...row.segments.map((s) => s.value));
          return {
            key: row.key,
            x: margin.left + (x(row.key) ?? 0),
            y: margin.top + y(peak),
            width: x.bandwidth(),
            height: Math.max(6, plotHeight - y(peak)),
            label: groupLabel(i),
            detail: (
              <>
                <strong>{data[i].label}</strong>
                {row.segments.map((segment) => {
                  const def = series.find((s) => s.key === segment.series);
                  return (
                    <span key={segment.series} className="chart-tooltip__row">
                      <span className="chart-legend__swatch" style={def ? swatchStyle(def.color, def.pattern) : undefined} />
                      {def?.label}: {formatValue(segment.value)}
                    </span>
                  );
                })}
                {mode === "stacked" && <span>Total: {formatValue(row.total)}</span>}
              </>
            ),
          };
        });

        return (
          <div className="chart__plot">
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={`${title}. ${mode === "stacked" ? "Stacked" : "Grouped"} bar chart of ${valueLabel.toLowerCase()} across ${data.length} categories and ${series.length} series.`}
              className={`bars bars--v ${animate ? "chart--animate" : ""}`}
            >
              <PatternDefs prefix={prefix} series={series} />
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {y.ticks(4).map((tick) => (
                  <g key={tick} transform={`translate(0, ${y(tick)})`}>
                    <line x1={0} x2={plotWidth} className="chart-grid" />
                    <text x={-6} dy="0.35em" textAnchor="end" className="chart-text chart-text--axis">
                      {formatValue(tick)}
                    </text>
                  </g>
                ))}
                {stacked.map((row, i) => {
                  const bx = x(row.key) ?? 0;
                  return (
                    <g key={row.key}>
                      {row.segments.map((segment) =>
                        mode === "stacked" ? (
                          <rect
                            key={segment.series}
                            className="bar"
                            x={bx}
                            y={y(segment.end)}
                            width={x.bandwidth()}
                            height={Math.max(0, y(segment.start) - y(segment.end))}
                            style={{ fill: fills.get(segment.series), animationDelay: `${i * 25}ms` }}
                          />
                        ) : (
                          <g key={segment.series}>
                            <rect
                              className="bar"
                              x={bx + (inner(segment.series) ?? 0)}
                              y={y(segment.value)}
                              width={inner.bandwidth()}
                              height={Math.max(0, plotHeight - y(segment.value))}
                              style={{ fill: fills.get(segment.series), animationDelay: `${i * 40}ms` }}
                            />
                            {inner.bandwidth() >= 26 && (
                              <text
                                x={bx + (inner(segment.series) ?? 0) + inner.bandwidth() / 2}
                                y={y(segment.value) - 4}
                                textAnchor="middle"
                                className="chart-text chart-text--value chart-text--small"
                              >
                                {formatValue(segment.value)}
                              </text>
                            )}
                          </g>
                        ),
                      )}
                      {i % labelEvery === 0 && (
                        <text x={bx + x.bandwidth() / 2} y={plotHeight + 18} textAnchor="middle" className="chart-text chart-text--axis">
                          {truncateLabel(data[i].label, Math.max(4, Math.floor((x.step() * labelEvery) / 7)))}
                        </text>
                      )}
                    </g>
                  );
                })}
                <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} className="chart-axis" />
              </g>
            </svg>
            <MarkLayer marks={marks} width={width} height={height} name={title} />
          </div>
        );
      }}
    </ChartFrame>
  );
}
