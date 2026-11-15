import type { CountryStat, FacilityStatus, FacilitySummary, Insights, Meta } from "../../data/types";

export function facility(overrides: Partial<FacilitySummary> & { fei: string }): FacilitySummary {
  return {
    name: `Facility ${overrides.fei}`,
    registrant: null,
    city: "Hyderabad",
    state: null,
    country: "India",
    countryCode: "IN",
    lat: 17.4,
    lon: 78.5,
    precision: "city",
    operations: [],
    status: "ok",
    lastActionDate: "2023-01-01",
    lastActionOk: true,
    seriousHistory: false,
    lastInspectionDate: "2023-01-01",
    actions: { NAI: 1, VAI: 0, OAI: 0 },
    inspections: 1,
    citations: 0,
    warningLetters: 0,
    letter483s: 0,
    importAlerts: 0,
    labels: 10,
    ...overrides,
  };
}

export const FACILITIES: FacilitySummary[] = [
  facility({ fei: "1", name: "Sun Plant", status: "warning_letter", lastActionDate: "2024-05-01", warningLetters: 1, labels: 400 }),
  facility({ fei: "2", name: "Ohio Works", city: "Columbus", state: "OH", country: "United States", countryCode: "US", lat: 40, lon: -83, status: "ok", labels: 50 }),
  facility({ fei: "3", name: "Shanghai Pharma", city: "Shanghai", country: "China", countryCode: "CN", lat: 31.2, lon: 121.5, status: "import_alert", lastActionDate: "2025-02-01", importAlerts: 1 }),
  facility({ fei: "4", name: "Pune Labs", city: "Pune", lat: 18.5, lon: 73.8, status: "oai", lastActionDate: "2022-03-01" }),
  facility({ fei: "5", name: "Nowhere Inc", lat: null, lon: null, status: "vai" }),
];

function country(code: string, name: string, values: Partial<CountryStat>): CountryStat {
  return { code, name, facilities: 0, labels: 0, inspections: 0, oai: 0, warningLetters: 0, importAlerts: 0, flagged: 0, ...values };
}

const statusCounts: Record<FacilityStatus, number> = { ok: 40, vai: 30, letter_483: 20, oai: 2, warning_letter: 6, import_alert: 2, unknown: 0 };

export const INSIGHTS: Insights = {
  byCountry: [
    country("IN", "India", { facilities: 50, labels: 2000, inspections: 200, oai: 20, warningLetters: 10, importAlerts: 4, flagged: 8 }),
    country("US", "United States", { facilities: 30, labels: 900, inspections: 300, oai: 15, warningLetters: 2, importAlerts: 0, flagged: 1 }),
    country("CN", "China", { facilities: 20, labels: 300, inspections: 50, oai: 5, warningLetters: 1, importAlerts: 2, flagged: 2 }),
  ],
  inspectionsByYear: [
    { year: 2023, NAI: 10, VAI: 8, OAI: 2 },
    { year: 2024, NAI: 12, VAI: 6, OAI: 3 },
  ],
  warningLettersByYear: [
    { year: 2023, count: 2 },
    { year: 2024, count: 5 },
  ],
  statusCounts,
  topCitations: [{ key: "21 CFR 211.192", label: "Failure investigations", count: 40 }],
  topLabelers: [{ key: "Acme", label: "Acme", count: 300 }],
  topIngredients: [{ key: "METFORMIN", label: "METFORMIN", count: 90 }],
  forms: [{ key: "TABLET", label: "TABLET", count: 500 }],
  routes: [{ key: "ORAL", label: "ORAL", count: 800 }],
};

export const META: Meta = {
  crawledAt: "2026-11-15T00:00:00Z",
  builtAt: "2026-11-15T23:00:00Z",
  source: "test",
  counts: { labels: 3000, labelsWithFacility: 2500, facilities: 100, countries: 3, inspections: 550, citations: 400, warningLetters: 13, letter483s: 70, importAlerts: 6 },
};
