import type { FacilitySummary } from "../../data/types";
import { titleCase } from "../ui/format";
import { FLAGGED_STATUSES, toneOf, type Tone } from "./geometry";

export const TONES: readonly Tone[] = ["good", "caution", "bad", "neutral"];

export const TONE_COPY: Record<Tone, { label: string; description: string; icon: string }> = {
  good: { label: "Acceptable", description: "latest action acceptable", icon: "●" },
  caution: { label: "Issues found", description: "issues found (VAI or Form 483)", icon: "▲" },
  bad: { label: "Serious action", description: "official action, warning letter or import alert", icon: "■" },
  neutral: { label: "No record", description: "no recorded action", icon: "○" },
};

export interface PlottedFacility {
  facility: FacilitySummary;
  lon: number;
  lat: number;
  tone: Tone;
  flagged: boolean;
}

export function plottable(facilities: readonly FacilitySummary[]): PlottedFacility[] {
  const result: PlottedFacility[] = [];
  for (const facility of facilities) {
    if (facility.lat == null || facility.lon == null) continue;
    result.push({ facility, lon: facility.lon, lat: facility.lat, tone: toneOf(facility.status), flagged: FLAGGED_STATUSES.has(facility.status) });
  }
  return result;
}

export function formatLocation(facility: FacilitySummary): string {
  const city = facility.city ? titleCase(facility.city) : null;
  return [city, facility.state, facility.country].filter(Boolean).join(", ");
}

export interface CountryRow {
  country: string;
  facilities: number;
  mapped: number;
  serious: number;
  labels: number;
}

export function countryRows(facilities: readonly FacilitySummary[]): CountryRow[] {
  const rows = new Map<string, CountryRow>();
  for (const f of facilities) {
    const row = rows.get(f.country) ?? { country: f.country, facilities: 0, mapped: 0, serious: 0, labels: 0 };
    row.facilities += 1;
    row.labels += f.labels;
    if (f.lat != null && f.lon != null) row.mapped += 1;
    if (FLAGGED_STATUSES.has(f.status)) row.serious += 1;
    rows.set(f.country, row);
  }
  return [...rows.values()].sort((a, b) => b.facilities - a.facilities || a.country.localeCompare(b.country));
}

export function matchFacilities(facilities: readonly FacilitySummary[], query: string): FacilitySummary[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const sorted = [...facilities].sort((a, b) => a.name.localeCompare(b.name));
  if (terms.length === 0) return sorted;
  return sorted.filter((f) => {
    const haystack = `${f.name} ${f.city ?? ""} ${f.state ?? ""} ${f.country} ${f.fei}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
