import type { FacilityStatus, FacilitySummary } from "../data/types";
import { STATUS_COPY } from "../content/copy";
import { compileQuery, toHaystack } from "./query";

export type FacilitySort = "name" | "recent" | "inspections" | "oai" | "products";

export interface FacilityQuery {
  q: string;
  country: string;
  status: FacilityStatus | "";
  operation: string;
  sort: FacilitySort;
  page: number;
}

export const DEFAULT_FACILITY_QUERY: FacilityQuery = { q: "", country: "", status: "", operation: "", sort: "name", page: 1 };

export const FACILITY_SORTS: Array<{ value: FacilitySort; label: string }> = [
  { value: "name", label: "Name (A–Z)" },
  { value: "recent", label: "Most recent action" },
  { value: "inspections", label: "Most inspections" },
  { value: "oai", label: "Most official actions (OAI)" },
  { value: "products", label: "Most products" },
];

const STATUSES = Object.keys(STATUS_COPY) as FacilityStatus[];
const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

export function countryName(facility: Pick<FacilitySummary, "country" | "countryCode">): string {
  const looksLikeCode = /^[A-Z]{2,3}$/.test(facility.country);
  if (looksLikeCode && facility.countryCode && regionNames) return regionNames.of(facility.countryCode) ?? facility.country;
  return facility.country;
}

export function facilityLocation(facility: FacilitySummary): string {
  return [facility.city, facility.state, countryName(facility)].filter(Boolean).join(", ");
}

export function readFacilityQuery(params: URLSearchParams): FacilityQuery {
  const sort = params.get("sort");
  const status = params.get("status");
  const page = Number.parseInt(params.get("page") ?? "", 10);
  return {
    q: params.get("q") ?? "",
    country: params.get("country") ?? "",
    status: STATUSES.includes(status as FacilityStatus) ? (status as FacilityStatus) : "",
    operation: params.get("operation") ?? "",
    sort: FACILITY_SORTS.some((s) => s.value === sort) ? (sort as FacilitySort) : "name",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function writeFacilityQuery(query: FacilityQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.country) params.set("country", query.country);
  if (query.status) params.set("status", query.status);
  if (query.operation) params.set("operation", query.operation);
  if (query.sort !== "name") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

const byName = (a: FacilitySummary, b: FacilitySummary) => a.name.localeCompare(b.name);
const descending = (pick: (f: FacilitySummary) => number) => (a: FacilitySummary, b: FacilitySummary) => pick(b) - pick(a) || byName(a, b);

const SORTERS: Record<FacilitySort, (a: FacilitySummary, b: FacilitySummary) => number> = {
  name: byName,
  recent: (a, b) => (b.lastActionDate ?? "").localeCompare(a.lastActionDate ?? "") || byName(a, b),
  inspections: descending((f) => f.inspections),
  oai: descending((f) => f.actions.OAI),
  products: descending((f) => f.labels),
};

const haystacks = new WeakMap<FacilitySummary, string>();
function haystackFor(facility: FacilitySummary): string {
  let haystack = haystacks.get(facility);
  if (!haystack) {
    haystack = toHaystack([facility.name, facility.registrant, facility.fei, facility.city, facility.state, facility.country, countryName(facility)]);
    haystacks.set(facility, haystack);
  }
  return haystack;
}

export function searchFacilities(facilities: FacilitySummary[], query: FacilityQuery): FacilitySummary[] {
  const matcher = query.q.trim() ? compileQuery(query.q) : null;
  return facilities
    .filter(
      (f) =>
        (!query.country || countryName(f) === query.country) &&
        (!query.status || f.status === query.status) &&
        (!query.operation || f.operations.includes(query.operation)) &&
        (!matcher || matcher(haystackFor(f))),
    )
    .sort(SORTERS[query.sort]);
}

export interface OptionCount<T extends string = string> {
  value: T;
  count: number;
}

function countValues<T extends string>(values: T[]): OptionCount<T>[] {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function facilityFilterOptions(facilities: FacilitySummary[]) {
  return {
    countries: countValues(facilities.map(countryName)),
    statuses: countValues(facilities.map((f) => f.status)),
    operations: countValues(facilities.flatMap((f) => f.operations)),
  };
}
