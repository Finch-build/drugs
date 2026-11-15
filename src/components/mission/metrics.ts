import type { CountryStat, FacilityStatus, FacilitySummary, Insights, Meta } from "../../data/types";
import { percent } from "../charts/scales";
import { formatNumber } from "../ui/format";

export const SERIOUS_STATUSES: readonly FacilityStatus[] = ["oai", "warning_letter", "import_alert"];

export interface CountryMetrics {
  code: string;
  name: string;
  facilities: number;
  labels: number;
  inspections: number;
  oaiRate: number;
  warningLettersPerFacility: number;
  importAlerts: number;
  flaggedShare: number;
}

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

export function countryMetrics(stat: CountryStat): CountryMetrics {
  return {
    code: stat.code,
    name: stat.name,
    facilities: stat.facilities,
    labels: stat.labels,
    inspections: stat.inspections,
    oaiRate: ratio(stat.oai, stat.inspections),
    warningLettersPerFacility: ratio(stat.warningLetters, stat.facilities),
    importAlerts: stat.importAlerts,
    flaggedShare: ratio(stat.flagged, stat.facilities),
  };
}

export function recentFlagged(facilities: readonly FacilitySummary[], limit = 12): FacilitySummary[] {
  return facilities
    .filter((f) => SERIOUS_STATUSES.includes(f.status))
    .sort((a, b) => (b.lastActionDate ?? "").localeCompare(a.lastActionDate ?? ""))
    .slice(0, limit);
}

export function flaggedShare(statusCounts: Record<FacilityStatus, number>): number {
  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  return ratio(SERIOUS_STATUSES.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0), total);
}

export interface Callout {
  key: string;
  value: string;
  text: string;
}

export function buildCallouts(insights: Insights, meta: Meta): Callout[] {
  const callouts: Callout[] = [];
  const countries = [...insights.byCountry].sort((a, b) => b.facilities - a.facilities);
  const totalFacilities = countries.reduce((sum, c) => sum + c.facilities, 0) || meta.counts.facilities;
  const [first, second] = countries;

  if (first) {
    callouts.push({
      key: "top-country",
      value: percent(first.facilities, totalFacilities),
      text: `of mapped facilities are in ${first.name}, more than any other country.`,
    });
  }
  if (first && second) {
    const a = countryMetrics(first);
    const b = countryMetrics(second);
    callouts.push({
      key: "oai-compare",
      value: percent(a.oaiRate, 1),
      text: `of FDA inspections in ${first.name} ended in official action, compared with ${percent(b.oaiRate, 1)} in ${second.name}.`,
    });
  }
  callouts.push({
    key: "flagged",
    value: percent(flaggedShare(insights.statusCounts), 1),
    text: "of facilities had a serious latest action: official action, a warning letter or an import alert.",
  });
  const peakLetters = [...insights.warningLettersByYear].sort((a, b) => b.count - a.count || b.year - a.year)[0];
  if (peakLetters) {
    callouts.push({
      key: "letters-peak",
      value: String(peakLetters.year),
      text: `saw the most warning letters to these facilities: ${formatNumber(peakLetters.count)}.`,
    });
  }
  const citation = insights.topCitations[0];
  if (citation) {
    callouts.push({
      key: "citation",
      value: formatNumber(citation.count),
      text: `citations of ${citation.key} (“${citation.label.replace(/\s+/g, " ")}”), the most common inspector finding.`,
    });
  }
  return callouts;
}
