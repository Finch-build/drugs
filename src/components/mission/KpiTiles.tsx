import type { Meta } from "../../data/types";
import { Sparkline } from "../charts/Sparkline";
import { formatNumber } from "../ui/format";
import { useCountUp } from "./useCountUp";

export type KpiKey = "labels" | "facilities" | "countries" | "inspections" | "warningLetters" | "letter483s" | "importAlerts";

const TILES: Array<{ key: KpiKey; label: string; tone?: "bad" | "caution" }> = [
  { key: "labels", label: "Generic drug labels" },
  { key: "facilities", label: "Manufacturing facilities" },
  { key: "countries", label: "Countries" },
  { key: "inspections", label: "FDA inspections" },
  { key: "letter483s", label: "Form 483s", tone: "caution" },
  { key: "warningLetters", label: "Warning letters", tone: "bad" },
  { key: "importAlerts", label: "Import alerts", tone: "bad" },
];

export interface Trend {
  values: number[];
  labels: string[];
}

export function KpiTiles({ meta, trends = {} }: { meta: Meta; trends?: Partial<Record<KpiKey, Trend>> }) {
  return (
    <ul className="kpis" aria-label="Dataset totals">
      {TILES.map((tile, index) => (
        <KpiTile key={tile.key} label={tile.label} value={meta.counts[tile.key]} tone={tile.tone} trend={trends[tile.key]} index={index} />
      ))}
    </ul>
  );
}

function KpiTile({ label, value, tone, trend, index }: { label: string; value: number; tone?: "bad" | "caution"; trend?: Trend; index: number }) {
  const shown = useCountUp(value);
  return (
    <li className={`kpi ${tone ? `kpi--${tone}` : ""}`} style={{ animationDelay: `${index * 60}ms` }}>
      <span className="kpi__value">
        <span aria-hidden="true">{formatNumber(shown)}</span>
        <span className="visually-hidden">{formatNumber(value)}</span>
      </span>
      <span className="kpi__label">{label}</span>
      {trend && trend.values.length > 1 && (
        <Sparkline className="kpi__spark" values={trend.values} labels={trend.labels} label={`${label} per year`} width={110} height={26} color={tone ? `var(--${tone})` : "var(--accent)"} />
      )}
    </li>
  );
}
