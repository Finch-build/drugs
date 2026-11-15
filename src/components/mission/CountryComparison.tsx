import { useId, useMemo, useState } from "react";
import type { CountryStat } from "../../data/types";
import { GroupedBarChart } from "../charts/MultiSeriesChart";
import { percent } from "../charts/scales";
import type { SeriesDef } from "../charts/types";
import { formatNumber } from "../ui/format";
import { countryMetrics, type CountryMetrics } from "./metrics";

const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const SLOT_PATTERNS = ["solid", "hatch", "dots"] as const;
const SLOT_NAMES = ["First", "Second", "Third"];

interface MetricRow {
  key: keyof CountryMetrics;
  label: string;
  format: (m: CountryMetrics) => string;
  hint?: string;
}

const ROWS: MetricRow[] = [
  { key: "facilities", label: "Facilities", format: (m) => formatNumber(m.facilities) },
  { key: "labels", label: "Linked drug labels", format: (m) => formatNumber(m.labels) },
  { key: "inspections", label: "FDA inspections", format: (m) => formatNumber(m.inspections) },
  { key: "oaiRate", label: "OAI rate", hint: "inspections ending in official action", format: (m) => percent(m.oaiRate, 1) },
  { key: "warningLettersPerFacility", label: "Warning letters per facility", format: (m) => m.warningLettersPerFacility.toFixed(2) },
  { key: "importAlerts", label: "Import alerts", format: (m) => formatNumber(m.importAlerts) },
  { key: "flaggedShare", label: "Flagged share", hint: "facilities with a serious latest action", format: (m) => percent(m.flaggedShare, 1) },
];

export function CountryComparison({ countries }: { countries: CountryStat[] }) {
  const sorted = useMemo(() => [...countries].sort((a, b) => b.facilities - a.facilities), [countries]);
  const [codes, setCodes] = useState<string[]>(() => [sorted[0]?.code ?? "", sorted[1]?.code ?? "", sorted[2]?.code ?? ""]);
  const baseId = useId();
  const chosen = codes
    .map((code, slot) => ({ slot, stat: sorted.find((c) => c.code === code) }))
    .filter((c): c is { slot: number; stat: CountryStat } => Boolean(c.stat));
  const metrics = chosen.map((c) => ({ slot: c.slot, m: countryMetrics(c.stat) }));

  const setSlot = (slot: number, code: string) => setCodes((current) => current.map((c, i) => (i === slot ? code : c)));
  const series: SeriesDef[] = metrics.map(({ slot, m }) => ({ key: m.code, label: m.name, color: SLOT_COLORS[slot], pattern: SLOT_PATTERNS[slot] }));
  const chartData = [
    { key: "oai", label: "OAI rate", values: Object.fromEntries(metrics.map(({ m }) => [m.code, m.oaiRate * 100])) },
    { key: "flagged", label: "Flagged share", values: Object.fromEntries(metrics.map(({ m }) => [m.code, m.flaggedShare * 100])) },
  ];

  return (
    <div className="compare">
      <fieldset className="compare__pickers">
        <legend>Choose up to three countries</legend>
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="field">
            <label htmlFor={`${baseId}-${slot}`}>{SLOT_NAMES[slot]} country</label>
            <select id={`${baseId}-${slot}`} className="select" value={codes[slot]} onChange={(e) => setSlot(slot, e.target.value)}>
              {slot > 1 && <option value="">None</option>}
              {sorted.map((c) => (
                <option key={c.code} value={c.code} disabled={codes.includes(c.code) && codes[slot] !== c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>

      {metrics.length > 0 && (
        <div className="compare__results">
          <div className="compare__table-wrap" role="region" aria-label="Country metrics table" tabIndex={0}>
            <table className="compare__table">
              <caption>Side-by-side country metrics</caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  {metrics.map(({ m, slot }) => (
                    <th key={m.code} scope="col" className="num">
                      <span className="compare__swatch" style={{ background: SLOT_COLORS[slot] }} aria-hidden="true" />
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      {row.label}
                      {row.hint && <span className="compare__hint">{row.hint}</span>}
                    </th>
                    {metrics.map(({ m }) => (
                      <td key={m.code} className="num">
                        {row.format(m)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <GroupedBarChart
            title="Enforcement rates compared"
            takeaway={rateTakeaway(metrics.map((x) => x.m))}
            data={chartData}
            series={series}
            valueLabel="Percent"
            categoryLabel="Metric"
            formatValue={(v) => `${Number(v.toFixed(1))}%`}
            height={240}
          />
        </div>
      )}
    </div>
  );
}

function rateTakeaway(metrics: CountryMetrics[]): string {
  if (metrics.length < 2) return "Pick another country to compare rates.";
  const highest = [...metrics].sort((a, b) => b.oaiRate - a.oaiRate)[0];
  const lowest = [...metrics].sort((a, b) => a.oaiRate - b.oaiRate)[0];
  if (highest.oaiRate === lowest.oaiRate) return "These countries have the same official action rate.";
  return `${highest.name} has the highest official action rate of this group (${percent(highest.oaiRate, 1)}), versus ${percent(lowest.oaiRate, 1)} for ${lowest.name}.`;
}
