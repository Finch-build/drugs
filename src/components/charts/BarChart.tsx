import { scaleBand, scaleLinear } from "d3-scale";
import { formatNumber } from "../ui/format";
import { ChartFrame } from "./ChartFrame";
import { MarkLayer, type Mark } from "./MarkLayer";
import { niceDomainMax, truncateLabel } from "./scales";
import type { BarDatum, ValueFormatter } from "./types";

export interface BarChartProps {
  title: string;
  takeaway: string;
  data: BarDatum[];
  valueLabel: string;
  orientation?: "horizontal" | "vertical";
  formatValue?: ValueFormatter;
  color?: string;
  highlightKey?: string;
  height?: number;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

const ROW = 30;
const GAP = 6;

export function BarChart({
  title,
  takeaway,
  data,
  valueLabel,
  orientation = "horizontal",
  formatValue = formatNumber,
  color = "var(--chart-1)",
  highlightKey,
  height = 260,
  headingLevel,
  className,
}: BarChartProps) {
  return (
    <ChartFrame
      title={title}
      takeaway={takeaway}
      headingLevel={headingLevel}
      className={className}
      columns={["Category", valueLabel]}
      rows={data.map((d) => [d.label, formatValue(d.value)])}
    >
      {(width, animate) =>
        orientation === "horizontal" ? (
          <HorizontalBars data={data} width={width} animate={animate} title={title} valueLabel={valueLabel} format={formatValue} color={color} highlightKey={highlightKey} />
        ) : (
          <VerticalBars data={data} width={width} height={height} animate={animate} title={title} valueLabel={valueLabel} format={formatValue} color={color} highlightKey={highlightKey} />
        )
      }
    </ChartFrame>
  );
}

interface InnerProps {
  data: BarDatum[];
  width: number;
  animate: boolean;
  title: string;
  valueLabel: string;
  format: ValueFormatter;
  color: string;
  highlightKey?: string;
}

function markDetail(d: BarDatum, valueLabel: string, format: ValueFormatter) {
  return (
    <>
      <strong>{d.label}</strong>
      <span>
        {format(d.value)} {valueLabel.toLowerCase()}
      </span>
    </>
  );
}

function HorizontalBars({ data, width, animate, title, valueLabel, format, color, highlightKey }: InnerProps) {
  const labelWidth = Math.round(Math.min(340, Math.max(96, width * (width > 700 ? 0.3 : 0.36))));
  const valueSpace = 64;
  const plotWidth = Math.max(40, width - labelWidth - valueSpace);
  const svgHeight = data.length * (ROW + GAP);
  const x = scaleLinear().domain([0, niceDomainMax(data.map((d) => d.value))]).range([0, plotWidth]);
  const maxChars = Math.floor(labelWidth / 7.2);

  const marks: Mark[] = data.map((d, i) => ({
    key: d.key,
    x: 0,
    y: i * (ROW + GAP),
    width,
    height: ROW,
    label: `${d.label}: ${format(d.value)} ${valueLabel.toLowerCase()}`,
    detail: markDetail(d, valueLabel, format),
  }));

  return (
    <div className="chart__plot">
      <svg width={width} height={svgHeight} role="img" aria-label={`${title}. Horizontal bar chart of ${data.length} categories.`} className={`bars bars--h ${animate ? "chart--animate" : ""}`}>
        {data.map((d, i) => {
          const y = i * (ROW + GAP);
          const barWidth = Math.max(d.value > 0 ? 2 : 0, x(d.value));
          const highlighted = highlightKey === d.key;
          return (
            <g key={d.key} transform={`translate(0, ${y})`}>
              <text x={labelWidth - 8} y={ROW / 2} dy="0.35em" textAnchor="end" className="chart-text">
                {truncateLabel(d.label, maxChars)}
              </text>
              <rect
                className="bar"
                x={labelWidth}
                y={3}
                width={barWidth}
                height={ROW - 6}
                style={{ fill: highlighted ? "var(--accent-2)" : color, animationDelay: `${i * 30}ms` }}
              />
              <text x={labelWidth + barWidth + 6} y={ROW / 2} dy="0.35em" className="chart-text chart-text--value">
                {format(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <MarkLayer marks={marks} width={width} height={svgHeight} name={title} />
    </div>
  );
}

function VerticalBars({ data, width, height, animate, title, valueLabel, format, color, highlightKey }: InnerProps & { height: number }) {
  const margin = { top: 20, right: 8, bottom: 28, left: 44 };
  const plotWidth = Math.max(40, width - margin.left - margin.right);
  const plotHeight = height - margin.top - margin.bottom;
  const x = scaleBand<string>().domain(data.map((d) => d.key)).range([0, plotWidth]).padding(0.2);
  const y = scaleLinear().domain([0, niceDomainMax(data.map((d) => d.value))]).range([plotHeight, 0]);
  const ticks = y.ticks(4);
  const labelEvery = Math.max(1, Math.ceil(36 / Math.max(1, x.step())));
  const showValues = x.bandwidth() >= 22;

  const marks: Mark[] = data.map((d) => ({
    key: d.key,
    x: margin.left + (x(d.key) ?? 0),
    y: margin.top + y(d.value),
    width: x.bandwidth(),
    height: Math.max(4, plotHeight - y(d.value)),
    label: `${d.label}: ${format(d.value)} ${valueLabel.toLowerCase()}`,
    detail: markDetail(d, valueLabel, format),
  }));

  return (
    <div className="chart__plot">
      <svg width={width} height={height} role="img" aria-label={`${title}. Vertical bar chart of ${data.length} categories.`} className={`bars bars--v ${animate ? "chart--animate" : ""}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {ticks.map((tick) => (
            <g key={tick} transform={`translate(0, ${y(tick)})`}>
              <line x1={0} x2={plotWidth} className="chart-grid" />
              <text x={-6} dy="0.35em" textAnchor="end" className="chart-text chart-text--axis">
                {format(tick)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const bx = x(d.key) ?? 0;
            const by = y(d.value);
            return (
              <g key={d.key}>
                <rect
                  className="bar"
                  x={bx}
                  y={by}
                  width={x.bandwidth()}
                  height={Math.max(0, plotHeight - by)}
                  style={{ fill: highlightKey === d.key ? "var(--accent-2)" : color, animationDelay: `${i * 25}ms` }}
                />
                {showValues && (
                  <text x={bx + x.bandwidth() / 2} y={by - 5} textAnchor="middle" className="chart-text chart-text--value chart-text--small">
                    {format(d.value)}
                  </text>
                )}
                {i % labelEvery === 0 && (
                  <text x={bx + x.bandwidth() / 2} y={plotHeight + 18} textAnchor="middle" className="chart-text chart-text--axis">
                    {truncateLabel(d.label, Math.max(3, Math.floor((x.step() * labelEvery) / 7)))}
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
}
