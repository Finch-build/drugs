import type { FacilityDetail, FacilitySummary, Insights, Label, Meta } from "./types";

const cache = new Map<string, Promise<unknown>>();

export function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`;
}

function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const request = fetch(dataUrl(path)).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
      return res.json() as Promise<T>;
    });
    request.catch(() => cache.delete(path));
    cache.set(path, request);
  }
  return cache.get(path) as Promise<T>;
}

export const loadMeta = () => load<Meta>("meta.json");
export const loadFacilities = () => load<FacilitySummary[]>("facilities.json");
export const loadInsights = () => load<Insights>("insights.json");
export const loadLabels = () => load<Label[]>("labels.json");
export const loadFacility = (fei: string) => load<FacilityDetail>(`facilities/${encodeURIComponent(fei)}.json`);

export function clearDataCache() {
  cache.clear();
}
