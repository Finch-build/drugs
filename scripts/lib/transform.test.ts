import { describe, expect, it } from "vitest";
import { buildInsights, countryName, deriveStatus, parseJsonList, toFacilityDetail, toLabel, type RawFacilityDetail, type RawLabel } from "./transform";

const rawLabel: RawLabel = {
  id: 88,
  document_id: "902d1bc4",
  labeler: "Preferred Pharmaceuticals",
  labeler_role: "REPACK",
  name: "Metformin Hydrochloride",
  ingredients: "METFORMIN HYDROCHLORIDE",
  form: "TABLET",
  dose: "850mg",
  route: "ORAL",
  package: "BOTTLE",
  package_amount: "30",
  anda: "ANDA-090564",
  nda: null,
  bla: null,
  product_ndc: "68788-8528",
  ndcs: "68788-8528-3 68788-8528-9",
  repack_ndc: "70010-064",
  feis: "3004097901 3005",
  color_short: '["white"]',
  color_long: '["white to off-white"]',
  shape: '["ROUND"]',
  flavor: "[]",
  imprint: '["G 11"]',
  authorized_generic: 0,
};

const rawFacility: RawFacilityDetail = {
  fei: "3004097901",
  registrant: "Granules India Ltd",
  facilities: [
    {
      entity_or_org: "Granules India Limited",
      registrant: "Granules India Ltd",
      address_line_1: "Sy.No. 160/A",
      address_line_2: null,
      city: "Medchal-Malkajgiri District",
      state: "Telangana",
      country: "India (IND)",
      country_alpha2: "IN",
      zip_or_num: "500043",
      duns: "918609236",
      operations: "ANALYSIS; LABEL; MANUFACTURE; PACK",
      expiration_date: "12/31/2025",
    },
  ],
  inspections: [
    { id: 1, date: "2020-02-14", year: 2020, action: "VAI", n_citations: 1 },
    { id: 2, date: "2018-03-23", year: 2018, action: "NAI", n_citations: 0 },
  ],
  citations: [{ id: 8, inspection_id: 1, act_cfr: "21 CFR 211.68(a)", short_desc: "Calibration not done", long_desc: "Long text" }],
  warning_letters: [
    {
      id: 97,
      date: "2025-02-26",
      company: "Granules India Limited",
      subject: "CGMP",
      issuing_office: "CDER",
      filename: "granules.pdf",
      fda_url: "https://www.fda.gov/x",
      closeout_letter_date: null,
      closeout_letter_url: null,
      fda_response_letter_url: null,
    },
  ],
  letter_483s: [{ id: 1718, date: "2024-09-06", file_path: "2024/483s/a b.pdf", unlinked: 1 }],
  import_alerts: [
    { id: 5, company: "Granules", start_date: "2023-01-01", last_date: "2025-11-06", overall_last_date: "2025-11-06", exempted_drugs: "A Tablet, B Capsule" },
  ],
  labels: [rawLabel],
  fei_summary: { last_act_date: "2025-02-26", last_act_was_ok: 0, last_act_infraction: "warning_letter", serious_finding_in_history: 1 },
};

describe("parseJsonList", () => {
  it("parses JSON-encoded string arrays and tolerates junk", () => {
    expect(parseJsonList('["a","b"]')).toEqual(["a", "b"]);
    expect(parseJsonList("not json")).toEqual([]);
    expect(parseJsonList(null)).toEqual([]);
  });
});

describe("toLabel", () => {
  it("maps raw fields into the label contract", () => {
    const label = toLabel(rawLabel);
    expect(label).toMatchObject({
      id: 88,
      documentId: "902d1bc4",
      labelerRole: "REPACK",
      ndcs: ["68788-8528-3", "68788-8528-9"],
      feis: ["3004097901", "3005"],
      colors: ["white"],
      shapes: ["ROUND"],
      flavors: [],
      imprints: ["G 11"],
      authorizedGeneric: false,
    });
  });
});

describe("deriveStatus", () => {
  it("maps the FEI summary to a facility status", () => {
    expect(deriveStatus({ last_act_was_ok: 1, last_act_infraction: null })).toBe("ok");
    expect(deriveStatus({ last_act_was_ok: 0, last_act_infraction: "483" })).toBe("letter_483");
    expect(deriveStatus({ last_act_was_ok: 0, last_act_infraction: "VAI" })).toBe("vai");
    expect(deriveStatus({ last_act_was_ok: 0, last_act_infraction: "OAI" })).toBe("oai");
    expect(deriveStatus({ last_act_was_ok: 0, last_act_infraction: "warning_letter" })).toBe("warning_letter");
    expect(deriveStatus({ last_act_was_ok: 0, last_act_infraction: "import_alert" })).toBe("import_alert");
    expect(deriveStatus(null)).toBe("unknown");
  });
});

describe("toFacilityDetail", () => {
  const geocode = () => ({ lat: 17.5, lon: 78.4, precision: "postal" as const });
  const detail = toFacilityDetail(rawFacility, geocode);

  it("builds a geocoded summary with counts", () => {
    expect(detail.summary).toMatchObject({
      fei: "3004097901",
      name: "Granules India Limited",
      country: "India",
      countryCode: "IN",
      lat: 17.5,
      precision: "postal",
      operations: ["ANALYSIS", "LABEL", "MANUFACTURE", "PACK"],
      status: "warning_letter",
      seriousHistory: true,
      lastInspectionDate: "2020-02-14",
      actions: { NAI: 1, VAI: 1, OAI: 0 },
      inspections: 2,
      citations: 1,
      warningLetters: 1,
      letter483s: 1,
      importAlerts: 1,
      labels: 1,
    });
  });

  it("nests citations under inspections, newest first", () => {
    expect(detail.inspections.map((i) => i.id)).toEqual([1, 2]);
    expect(detail.inspections[0].citations[0]).toEqual({ id: 8, cfr: "21 CFR 211.68(a)", short: "Calibration not done", long: "Long text" });
  });

  it("builds ProPublica document URLs", () => {
    expect(detail.warningLetters[0].url).toBe("https://static.propublica.org/fda-inspection-documents/warning-letters/granules.pdf");
    expect(detail.letter483s[0].url).toBe("https://static.propublica.org/fda-inspection-documents/483s/2024%2F483s%2Fa%20b.pdf");
    expect(detail.letter483s[0].linkedToInspection).toBe(false);
  });

  it("marks an import alert active when last seen on the latest list", () => {
    expect(detail.importAlerts[0]).toMatchObject({ active: true, exemptedDrugs: ["A Tablet", "B Capsule"] });
  });
});

describe("buildInsights", () => {
  it("aggregates by country, year and status", () => {
    const detail = toFacilityDetail(rawFacility, () => null);
    const insights = buildInsights([detail], [toLabel(rawLabel)]);
    expect(insights.byCountry[0]).toMatchObject({ code: "IN", facilities: 1, inspections: 2, warningLetters: 1, importAlerts: 1, flagged: 1 });
    expect(insights.inspectionsByYear).toEqual([
      { year: 2018, NAI: 1, VAI: 0, OAI: 0 },
      { year: 2020, NAI: 0, VAI: 1, OAI: 0 },
    ]);
    expect(insights.statusCounts.warning_letter).toBe(1);
    expect(insights.topCitations[0]).toEqual({ key: "21 CFR 211.68(a)", label: "Calibration not done", count: 1 });
    expect(insights.topLabelers[0]).toEqual({ key: "Preferred Pharmaceuticals", label: "Preferred Pharmaceuticals", count: 1 });
    expect(insights.forms[0].key).toBe("TABLET");
  });
});

describe("countryName", () => {
  it("names countries consistently from their ISO code", () => {
    expect(countryName("IT", "ITA")).toBe("Italy");
    expect(countryName("US", "United States (USA)")).toBe("United States");
    expect(countryName(null, "India (IND)")).toBe("India");
    expect(countryName("ZZ", "Atlantis")).toBe("Atlantis");
  });
});
