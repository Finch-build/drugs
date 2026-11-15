import { FACET_KEYS, type FacetKey, type Filters } from "./labels";

export interface LabelSearchState {
  name: string;
  labeler: string;
  ndc: string;
  q: string;
  advanced: boolean;
  page: number;
  filters: Filters;
}

export function readLabelSearch(params: URLSearchParams): LabelSearchState {
  const filters: Filters = {};
  for (const key of FACET_KEYS) {
    const values = params.getAll(key).filter(Boolean);
    if (values.length) filters[key] = values;
  }
  const page = Number.parseInt(params.get("page") ?? "", 10);
  return {
    name: params.get("name") ?? "",
    labeler: params.get("labeler") ?? "",
    ndc: params.get("ndc") ?? "",
    q: params.get("q") ?? "",
    advanced: params.get("advanced") === "true",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    filters,
  };
}

export function writeLabelSearch(state: LabelSearchState): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ["name", "labeler", "ndc", "q"] as const) if (state[key].trim()) params.set(key, state[key].trim());
  if (state.advanced) params.set("advanced", "true");
  if (state.page > 1) params.set("page", String(state.page));
  for (const key of FACET_KEYS) for (const value of state.filters[key] ?? []) params.append(key, value);
  return params;
}

export function toggleFilterValue(filters: Filters, key: FacetKey, value: string): Filters {
  const current = filters[key] ?? [];
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  const result: Filters = { ...filters };
  if (next.length) result[key] = next;
  else delete result[key];
  return result;
}

export function hasSearch(state: LabelSearchState): boolean {
  return Boolean(state.name.trim() || state.labeler.trim() || state.ndc.trim() || state.q.trim());
}

export function describeSearch(state: LabelSearchState): string {
  if (state.ndc.trim()) return `NDC “${state.ndc.trim()}”`;
  const parts: string[] = [];
  if (state.name.trim()) parts.push(`“${state.name.trim()}”`);
  if (state.q.trim()) parts.push(`“${state.q.trim()}”`);
  if (state.labeler.trim()) parts.push(`${parts.length ? "from " : "company "}“${state.labeler.trim()}”`);
  return parts.join(" ");
}
