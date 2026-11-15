import type {
  ActionCounts,
  CountItem,
  CountryStat,
  FacilityDetail,
  FacilityStatus,
  FacilitySummary,
  GeoPrecision,
  InspectionAction,
  Insights,
  Label,
} from "../../src/data/types";
import { splitList } from "./queue";

const DOCS_BASE = "https://static.propublica.org/fda-inspection-documents";

type Nullable<T> = { [K in keyof T]?: T[K] | null };

export interface RawLabel {
  id: number;
  document_id: string;
  labeler: string | null;
  labeler_role: string | null;
  name: string | null;
  ingredients: string | null;
  form: string | null;
  dose: string | null;
  route: string | null;
  package: string | null;
  package_amount: string | null;
  anda: string | null;
  nda: string | null;
  bla: string | null;
  product_ndc: string | null;
  ndcs: string | null;
  repack_ndc: string | null;
  feis: string | null;
  color_short: string | null;
  color_long: string | null;
  shape: string | null;
  flavor: string | null;
  imprint: string | null;
  authorized_generic: number | null;
}

interface RawFeiSummary {
  last_act_date?: string | null;
  last_act_was_ok: number | null;
  last_act_infraction: string | null;
  serious_finding_in_history?: number | null;
}

export interface RawFacilityDetail {
  fei: string;
  registrant: string | null;
  facilities: Array<
    Nullable<{
      entity_or_org: string;
      registrant: string;
      address_line_1: string;
      address_line_2: string;
      city: string;
      state: string;
      country: string;
      country_alpha2: string;
      zip_or_num: string;
      duns: string;
      operations: string;
      expiration_date: string;
    }>
  >;
  inspections: Array<{ id: number; date: string; year: number; action: string; n_citations?: number }>;
  citations: Array<{ id: number; inspection_id: number; act_cfr: string; short_desc: string; long_desc: string }>;
  warning_letters: Array<
    { id: number; date: string } & Nullable<{
      company: string;
      subject: string;
      issuing_office: string;
      filename: string;
      fda_url: string;
      closeout_letter_date: string;
      closeout_letter_url: string;
      fda_response_letter_url: string;
    }>
  >;
  letter_483s: Array<{ id: number; date: string; file_path: string; unlinked?: number | null }>;
  import_alerts: Array<
    { id: number; start_date: string } & Nullable<{ company: string; last_date: string; overall_last_date: string; exempted_drugs: string }>
  >;
  labels: RawLabel[];
  fei_summary: RawFeiSummary | null;
}

export interface GeoResult {
  lat: number;
  lon: number;
  precision: GeoPrecision;
}

export type Geocode = (place: { country: string | null; zip: string | null; city: string | null; state: string | null }) => GeoResult | null;

export function parseJsonList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && v.length > 0) : [];
  } catch {
    return [];
  }
}

export function cleanCountry(value: string | null | undefined): string {
  return (value ?? "Unknown").replace(/\s*\([A-Z]{3}\)\s*$/, "").trim() || "Unknown";
}

export function toLabel(raw: RawLabel): Label {
  return {
    id: raw.id,
    documentId: raw.document_id,
    labeler: raw.labeler ?? "Unknown",
    labelerRole: raw.labeler_role,
    name: raw.name ?? raw.ingredients ?? "Unknown",
    ingredients: raw.ingredients ?? "",
    form: raw.form,
    dose: raw.dose,
    route: raw.route,
    package: raw.package,
    packageAmount: raw.package_amount,
    anda: raw.anda,
    nda: raw.nda,
    bla: raw.bla,
    productNdc: raw.product_ndc,
    ndcs: splitList(raw.ndcs),
    repackNdc: raw.repack_ndc,
    feis: splitList(raw.feis),
    colors: parseJsonList(raw.color_short),
    colorsLong: parseJsonList(raw.color_long),
    shapes: parseJsonList(raw.shape),
    flavors: parseJsonList(raw.flavor),
    imprints: parseJsonList(raw.imprint),
    authorizedGeneric: raw.authorized_generic === 1,
  };
}

const INFRACTION_STATUS: Record<string, FacilityStatus> = {
  "483": "letter_483",
  VAI: "vai",
  OAI: "oai",
  warning_letter: "warning_letter",
  import_alert: "import_alert",
};

export function deriveStatus(summary: Pick<RawFeiSummary, "last_act_was_ok" | "last_act_infraction"> | null): FacilityStatus {
  if (!summary || summary.last_act_was_ok === null || summary.last_act_was_ok === undefined) return "unknown";
  if (summary.last_act_was_ok === 1) return "ok";
  return INFRACTION_STATUS[summary.last_act_infraction ?? ""] ?? "unknown";
}

const isAction = (value: string): value is InspectionAction => value === "NAI" || value === "VAI" || value === "OAI";
const byDateDesc = <T extends { date: string | null }>(a: T, b: T) => (b.date ?? "").localeCompare(a.date ?? "");

export function toFacilityDetail(raw: RawFacilityDetail, geocode: Geocode): FacilityDetail {
  const primary = raw.facilities[0] ?? {};
  const countryCode = primary.country_alpha2 ?? null;
  const geo = geocode({ country: countryCode, zip: primary.zip_or_num ?? null, city: primary.city ?? null, state: primary.state ?? null });

  const inspections = raw.inspections
    .filter((i) => isAction(i.action))
    .map((i) => ({
      id: i.id,
      date: i.date,
      year: i.year,
      action: i.action as InspectionAction,
      citations: raw.citations
        .filter((c) => c.inspection_id === i.id)
        .map((c) => ({ id: c.id, cfr: c.act_cfr, short: c.short_desc, long: c.long_desc })),
    }))
    .sort(byDateDesc);

  const actions: ActionCounts = { NAI: 0, VAI: 0, OAI: 0 };
  for (const i of inspections) actions[i.action]++;

  const operations = [...new Set(raw.facilities.flatMap((f) => (f.operations ?? "").split(";").map((s) => s.trim()).filter(Boolean)))];
  const importAlerts = raw.import_alerts
    .map((a) => ({
      id: a.id,
      company: a.company ?? null,
      startDate: a.start_date,
      lastSeen: a.last_date ?? null,
      active: Boolean(a.last_date && a.last_date === a.overall_last_date),
      exemptedDrugs: (a.exempted_drugs ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const summary: FacilitySummary = {
    fei: raw.fei,
    name: primary.entity_or_org ?? raw.registrant ?? raw.fei,
    registrant: raw.registrant,
    city: primary.city ?? null,
    state: primary.state ?? null,
    country: cleanCountry(primary.country),
    countryCode,
    lat: geo ? round(geo.lat) : null,
    lon: geo ? round(geo.lon) : null,
    precision: geo?.precision ?? null,
    operations,
    status: deriveStatus(raw.fei_summary),
    lastActionDate: raw.fei_summary?.last_act_date ?? null,
    lastActionOk: raw.fei_summary?.last_act_was_ok === null || raw.fei_summary?.last_act_was_ok === undefined ? null : raw.fei_summary.last_act_was_ok === 1,
    seriousHistory: raw.fei_summary?.serious_finding_in_history === 1,
    lastInspectionDate: inspections[0]?.date ?? null,
    actions,
    inspections: inspections.length,
    citations: raw.citations.length,
    warningLetters: raw.warning_letters.length,
    letter483s: raw.letter_483s.length,
    importAlerts: importAlerts.length,
    labels: raw.labels.length,
  };

  return {
    summary,
    addresses: raw.facilities.map((f) => ({
      entity: f.entity_or_org ?? summary.name,
      registrant: f.registrant ?? null,
      line1: f.address_line_1 ?? null,
      line2: f.address_line_2 ?? null,
      city: f.city ?? null,
      state: f.state ?? null,
      country: f.country ? cleanCountry(f.country) : null,
      zip: f.zip_or_num ?? null,
      duns: f.duns ?? null,
      operations: (f.operations ?? "").split(";").map((s) => s.trim()).filter(Boolean),
      expirationDate: f.expiration_date ?? null,
    })),
    inspections,
    warningLetters: raw.warning_letters
      .map((w) => ({
        id: w.id,
        date: w.date,
        company: w.company ?? summary.name,
        subject: w.subject ?? null,
        issuingOffice: w.issuing_office ?? null,
        url: w.filename ? `${DOCS_BASE}/warning-letters/${encodeURIComponent(w.filename)}` : w.fda_url ?? "",
        closeoutDate: w.closeout_letter_date ?? null,
        closeoutUrl: w.closeout_letter_url ?? null,
        responseUrl: w.fda_response_letter_url ?? null,
      }))
      .sort(byDateDesc),
    letter483s: raw.letter_483s
      .map((l) => ({
        id: l.id,
        date: l.date,
        url: `${DOCS_BASE}/483s/${encodeURIComponent(l.file_path)}`,
        linkedToInspection: l.unlinked !== 1,
      }))
      .sort(byDateDesc),
    importAlerts,
    labelIds: [...new Set(raw.labels.map((l) => l.id))].sort((a, b) => a - b),
  };
}

const round = (n: number) => Math.round(n * 1e4) / 1e4;

function topCounts(entries: Iterable<[string, string]>, limit: number): CountItem[] {
  const counts = new Map<string, CountItem>();
  for (const [key, label] of entries) {
    const item = counts.get(key) ?? { key, label, count: 0 };
    item.count++;
    counts.set(key, item);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).slice(0, limit);
}

const FLAGGED: FacilityStatus[] = ["oai", "warning_letter", "import_alert"];

export function buildInsights(details: FacilityDetail[], labels: Label[]): Insights {
  const countries = new Map<string, CountryStat>();
  const labelsPerFei = new Map<string, number>();
  for (const label of labels) for (const fei of label.feis) labelsPerFei.set(fei, (labelsPerFei.get(fei) ?? 0) + 1);

  const years = new Map<number, ActionCounts>();
  const letterYears = new Map<number, number>();
  const statusCounts = { ok: 0, vai: 0, letter_483: 0, oai: 0, warning_letter: 0, import_alert: 0, unknown: 0 } as Record<FacilityStatus, number>;

  for (const { summary, inspections, warningLetters } of details) {
    const code = summary.countryCode ?? "??";
    const stat = countries.get(code) ?? { code, name: summary.country, facilities: 0, labels: 0, inspections: 0, oai: 0, warningLetters: 0, importAlerts: 0, flagged: 0 };
    stat.facilities++;
    stat.labels += labelsPerFei.get(summary.fei) ?? summary.labels;
    stat.inspections += summary.inspections;
    stat.oai += summary.actions.OAI;
    stat.warningLetters += summary.warningLetters;
    stat.importAlerts += summary.importAlerts;
    if (FLAGGED.includes(summary.status)) stat.flagged++;
    countries.set(code, stat);
    statusCounts[summary.status]++;

    for (const inspection of inspections) {
      const year = years.get(inspection.year) ?? { NAI: 0, VAI: 0, OAI: 0 };
      year[inspection.action]++;
      years.set(inspection.year, year);
    }
    for (const letter of warningLetters) {
      const year = Number(letter.date.slice(0, 4));
      letterYears.set(year, (letterYears.get(year) ?? 0) + 1);
    }
  }

  return {
    byCountry: [...countries.values()].sort((a, b) => b.facilities - a.facilities || a.name.localeCompare(b.name)),
    inspectionsByYear: [...years.entries()].sort(([a], [b]) => a - b).map(([year, counts]) => ({ year, ...counts })),
    warningLettersByYear: [...letterYears.entries()].sort(([a], [b]) => a - b).map(([year, count]) => ({ year, count })),
    statusCounts,
    topCitations: topCounts(
      details.flatMap((d) => d.inspections.flatMap((i) => i.citations.map((c): [string, string] => [c.cfr, c.short]))),
      15,
    ),
    topLabelers: topCounts(labels.map((l): [string, string] => [l.labeler, l.labeler]), 15),
    topIngredients: topCounts(labels.map((l): [string, string] => [l.ingredients, l.ingredients]), 15),
    forms: topCounts(labels.filter((l) => l.form).map((l): [string, string] => [l.form!, l.form!]), 12),
    routes: topCounts(labels.filter((l) => l.route).map((l): [string, string] => [l.route!, l.route!]), 10),
  };
}
