import type { Label } from "../data/types";
import { compileQuery, normalizeText, parseQuery, positiveTerms, toHaystack, type Matcher } from "./query";

export interface LabelSearchParams {
  name?: string;
  labeler?: string;
  ndc?: string;
  q?: string;
}

export interface IndexedLabel {
  label: Label;
  all: string;
  name: string;
  labeler: string;
  ndcDigits: string[];
}

export type LabelIndex = IndexedLabel[];

export function createLabelIndex(labels: Label[]): LabelIndex {
  return labels.map((label) => {
    const ndcList = [label.productNdc, label.repackNdc, ...label.ndcs].filter((n): n is string => Boolean(n));
    return {
      label,
      name: toHaystack([label.name, label.ingredients]),
      labeler: toHaystack([label.labeler]),
      all: toHaystack([
        label.name,
        label.ingredients,
        label.labeler,
        label.form,
        label.dose,
        label.route,
        label.anda,
        label.nda,
        label.bla,
        ...ndcList,
        ...label.imprints,
        ...label.colors,
        ...label.shapes,
        ...label.flavors,
        ...label.feis,
      ]),
      ndcDigits: ndcList.flatMap(ndcVariants),
    };
  });
}

export function normalizeNdc(value: string): string {
  return value
    .replace(/^\s*ndc[:#\s]*/i, "")
    .trim()
    .replace(/[^\d-\s]/g, "")
    .replace(/\s+/g, "-");
}

function ndcVariants(ndc: string): string[] {
  const parts = ndc.split("-");
  const digits = parts.join("");
  if (parts.length !== 3) return [digits];
  const widths = [5, 4, 2];
  const padded = parts.map((p, i) => p.padStart(widths[i], "0")).join("");
  return [...new Set([digits, padded])];
}

function ndcMatcher(input: string): ((entry: IndexedLabel) => boolean) | null {
  const normalized = normalizeNdc(input);
  if (!normalized.replace(/-/g, "")) return null;
  const targets = new Set([normalized.replace(/-/g, ""), ...ndcVariants(normalized)]);
  return (entry) => entry.ndcDigits.some((d) => [...targets].some((t) => d === t || (t.length >= 6 && d.startsWith(t))));
}

const allWords = (input: string | undefined): Matcher | null => {
  const words = normalizeText(input ?? "").split(" ").filter(Boolean);
  if (!words.length) return null;
  return compileQuery(words.join(" "));
};

export function searchLabels(index: LabelIndex, params: LabelSearchParams): Label[] {
  const nameMatch = allWords(params.name);
  const labelerMatch = allWords(params.labeler);
  const ndcMatch = params.ndc ? ndcMatcher(params.ndc) : null;
  const advanced = params.q ? compileQuery(params.q) : null;
  if (!nameMatch && !labelerMatch && !ndcMatch && !advanced) return [];

  const terms = [...positiveTerms(parseQuery(params.q ?? "")), ...normalizeText(params.name ?? "").split(" ").filter(Boolean)];
  const scored: Array<{ label: Label; score: number }> = [];
  for (const entry of index) {
    if (nameMatch && !nameMatch(entry.name)) continue;
    if (labelerMatch && !labelerMatch(entry.labeler)) continue;
    if (ndcMatch && !ndcMatch(entry)) continue;
    if (advanced && !advanced(entry.all)) continue;
    const score = terms.reduce((s, t) => s + (entry.name.includes(` ${t}`) ? 2 : 0) + (entry.labeler.includes(` ${t}`) ? 1 : 0), 0);
    scored.push({ label: entry.label, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.label.id - b.label.id).map((s) => s.label);
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facets {
  doses: FacetValue[];
  forms: FacetValue[];
  shapes: FacetValue[];
  colors: FacetValue[];
  imprints: FacetValue[];
  flavors: FacetValue[];
  ndcs: FacetValue[];
  labelers: FacetValue[];
}

export type FacetKey = keyof Facets;
export type Filters = Partial<Record<FacetKey, string[]>>;

const FACET_VALUES: Record<FacetKey, (l: Label) => string[]> = {
  doses: (l) => (l.dose ? [l.dose] : []),
  forms: (l) => (l.form ? [l.form] : []),
  shapes: (l) => l.shapes,
  colors: (l) => l.colors,
  imprints: (l) => l.imprints,
  flavors: (l) => l.flavors,
  ndcs: (l) => (l.productNdc ? [l.productNdc] : []),
  labelers: (l) => [l.labeler],
};

export const FACET_KEYS = Object.keys(FACET_VALUES) as FacetKey[];

export function buildFacets(labels: Label[]): Facets {
  const facets = {} as Facets;
  for (const key of FACET_KEYS) {
    const counts = new Map<string, number>();
    for (const label of labels) for (const v of new Set(FACET_VALUES[key](label))) counts.set(v, (counts.get(v) ?? 0) + 1);
    facets[key] = [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, undefined, { numeric: true }));
  }
  return facets;
}

export function applyFilters(labels: Label[], filters: Filters): Label[] {
  const active = FACET_KEYS.filter((k) => filters[k]?.length);
  if (!active.length) return labels;
  return labels.filter((label) => active.every((k) => FACET_VALUES[k](label).some((v) => filters[k]!.includes(v))));
}

export function sameFacilities(labels: Label[]): boolean {
  if (labels.length < 2 || !labels[0].feis.length) return false;
  const key = [...labels[0].feis].sort().join(",");
  return labels.every((l) => [...l.feis].sort().join(",") === key);
}
