import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { formatNumber } from "../ui/format";

export function niceDomainMax(values: readonly number[]): number {
  const top = max(values) ?? 0;
  if (top <= 0) return 1;
  return scaleLinear().domain([0, top]).nice(5).domain()[1];
}

export interface StackInput {
  key: string;
  values: Partial<Record<string, number>>;
}

export interface StackSegment {
  series: string;
  value: number;
  start: number;
  end: number;
}

export interface StackRow {
  key: string;
  total: number;
  segments: StackSegment[];
}

export function stackLayout(rows: readonly StackInput[], series: readonly string[]): StackRow[] {
  return rows.map((row) => {
    let running = 0;
    const segments = series.map((name) => {
      const value = row.values[name] ?? 0;
      const segment = { series: name, value, start: running, end: running + value };
      running += value;
      return segment;
    });
    return { key: row.key, total: running, segments };
  });
}

export interface PieArc {
  key: string;
  value: number;
  share: number;
  startAngle: number;
  endAngle: number;
}

export function pieLayout(items: ReadonlyArray<{ key: string; value: number }>): PieArc[] {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  let angle = 0;
  return items.map((item) => {
    const share = total > 0 ? Math.max(0, item.value) / total : 0;
    const startAngle = angle;
    angle += share * Math.PI * 2;
    return { key: item.key, value: item.value, share, startAngle, endAngle: angle };
  });
}

export function percent(part: number, whole: number, digits = 1): string {
  if (!whole) return "—";
  return `${Number(((part / whole) * 100).toFixed(digits))}%`;
}

export function truncateLabel(label: string, maxChars: number): string {
  const clean = label.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

export function describeTrend(values: readonly number[], labels: readonly string[]): string {
  if (values.length === 0) return "No data.";
  let peak = 0;
  values.forEach((value, index) => {
    if (value > values[peak]) peak = index;
  });
  const last = values.length - 1;
  return `From ${formatNumber(values[0])} in ${labels[0]} to ${formatNumber(values[last])} in ${labels[last]}, peaking at ${formatNumber(values[peak])} in ${labels[peak]}.`;
}
