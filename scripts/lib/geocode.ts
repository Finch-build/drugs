export type LatLon = [number, number];
export type Precision = "postal" | "city" | "region" | "country";

export interface Gazetteer {
  postal: Map<string, LatLon>;
  cities: Map<string, LatLon>;
  regions: Map<string, LatLon>;
  countries: Map<string, LatLon>;
}

export interface PlaceQuery {
  country: string | null;
  zip: string | null;
  city: string | null;
  state: string | null;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  precision: Precision;
}

const ADMIN_SUFFIXES = /\b(district|dist|province|prefecture|county|city|municipality|region|state|mandal|taluk|tehsil)\b/g;

export function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(ADMIN_SUFFIXES, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function postalKeys(country: string, zip: string | null): string[] {
  if (!zip) return [];
  const raw = zip.trim().toUpperCase();
  const candidates = [raw, raw.replace(/\s+/g, ""), raw.split(/[\s-]/)[0]];
  if (country === "US" && /^\d{4}$/.test(raw)) candidates.push(raw.padStart(5, "0"));
  return [...new Set(candidates.filter(Boolean))].map((c) => `${country}|${c}`);
}

function lookupName(table: Map<string, LatLon>, country: string, name: string | null): LatLon | undefined {
  if (!name) return undefined;
  const normalized = normalizePlace(name);
  if (!normalized) return undefined;
  const exact = table.get(`${country}|${normalized}`);
  if (exact) return exact;
  const words = normalized.split(" ");
  for (let size = words.length - 1; size >= 1; size--) {
    for (let start = 0; start + size <= words.length; start++) {
      const hit = table.get(`${country}|${words.slice(start, start + size).join(" ")}`);
      if (hit) return hit;
    }
  }
  return undefined;
}

const US_TERRITORIES: Array<[RegExp, string]> = [
  [/puerto rico|\(PR\)/i, "PR"],
  [/virgin islands|\(VI\)/i, "VI"],
  [/\bguam\b|\(GU\)/i, "GU"],
];

export function geoCountry(country: string | null, state: string | null): string | null {
  if (country !== "US" || !state) return country;
  return US_TERRITORIES.find(([pattern]) => pattern.test(state))?.[1] ?? country;
}

export function createGeocoder(gazetteer: Gazetteer) {
  return ({ country: rawCountry, zip, city, state }: PlaceQuery): GeoPoint | null => {
    const country = geoCountry(rawCountry, state);
    if (!country) return null;
    const point = (coords: LatLon, precision: Precision): GeoPoint => ({ lat: coords[0], lon: coords[1], precision });

    for (const key of postalKeys(country, zip)) {
      const hit = gazetteer.postal.get(key);
      if (hit) return point(hit, "postal");
    }
    const cityHit = lookupName(gazetteer.cities, country, city);
    if (cityHit) return point(cityHit, "city");
    const regionHit = lookupName(gazetteer.regions, country, state) ?? lookupName(gazetteer.cities, country, state);
    if (regionHit) return point(regionHit, "region");
    const countryHit = gazetteer.countries.get(country);
    return countryHit ? point(countryHit, "country") : null;
  };
}
