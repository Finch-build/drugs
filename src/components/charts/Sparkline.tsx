import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import { formatNumber } from "../ui/format";
import { ChartFrame } from "./ChartFrame";
import { describeTrend } from "./scales";

export interface SparklineProps {
  values: number[];
  labels: string[];
  label: string;
  width?: number;
  height?: number;
  color?: string;
  title?: string;
  takeaway?: string;
  valueLabel?: string;
  className?: string;
}

export function Sparkline({ values, labels, label, width = 120, height = 32, color = "var(--chart-1)", title, takeaway, valueLabel = "Value", className = "" }: SparklineProps) {
  const svg = (w: number) => <SparkSvg values={values} labels={labels} label={label} width={w} height={height} color={color} className={className} />;
  if (!title) return svg(width);
  return (
    <ChartFrame
      title={title}
      takeaway={takeaway ?? describeTrend(values, labels)}
      columns={["Period", valueLabel]}
      rows={values.map((v, i) => [labels[i], formatNumber(v)])}
    >
      {(w) => svg(w)}
    </ChartFrame>
  );
}

function SparkSvg({ values, labels, label, width, height, color, className }: Required<Pick<SparklineProps, "values" | "labels" | "label" | "width" | "height" | "color" | "className">>) {
  const pad = 3;
  const x = scaleLinear().domain([0, Math.max(1, values.length - 1)]).range([pad, width - pad]);
  const y = scaleLinear().domain([0, Math.max(1, ...values)]).range([height - pad, pad]);
  const path = line<number>().x((_, i) => x(i)).y((v) => y(v))(values) ?? "";
  const fill = area<number>().x((_, i) => x(i)).y0(height - pad).y1((v) => y(v))(values) ?? "";
  const last = values.length - 1;
  return (
    <svg width={width} height={height} role="img" aria-label={`${label}. ${describeTrend(values, labels)}`} className={`sparkline ${className}`}>
      <path d={fill} style={{ fill: color, opacity: 0.15 }} />
      <path d={path} className="sparkline__line" style={{ stroke: color }} />
      {last >= 0 && <circle cx={x(last)} cy={y(values[last])} r={2.5} style={{ fill: color }} />}
    </svg>
  );
}
