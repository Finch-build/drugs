import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReleaseLinks } from "./lib/release";
import type { FacilityDetail, FacilitySummary, Insights, Label, Meta } from "../src/data/types";

const DATA = "public/data";
const read = <T>(path: string): T => JSON.parse(readFileSync(join(DATA, path), "utf8"));

describe.runIf(existsSync(join(DATA, "meta.json")))("built dataset", () => {
  const meta = read<Meta>("meta.json");
  const facilities = read<FacilitySummary[]>("facilities.json");
  const labels = read<Label[]>("labels.json");
  const insights = read<Insights>("insights.json");
  const feis = new Set(facilities.map((f) => f.fei));

  it("matches the counts recorded in meta.json", () => {
    expect(meta.counts.facilities).toBe(facilities.length);
    expect(meta.counts.labels).toBe(labels.length);
    expect(meta.counts.labelsWithFacility).toBe(labels.filter((l) => l.feis.length).length);
  });

  it("has unique facility FEIs and label ids", () => {
    expect(feis.size).toBe(facilities.length);
    expect(new Set(labels.map((l) => l.id)).size).toBe(labels.length);
  });

  it("writes a detail file for every facility and nothing else", () => {
    const files = readdirSync(join(DATA, "facilities")).map((f) => f.replace(/\.json$/, ""));
    expect(new Set(files)).toEqual(feis);
  });

  it("links almost every facility-matched label to a crawled facility", () => {
    const referenced = labels.flatMap((l) => l.feis);
    const resolved = referenced.filter((fei) => feis.has(fei)).length;
    expect(resolved / referenced.length).toBeGreaterThan(0.999);
  });

  it("contains every drug → facility link from ProPublica's public data release", () => {
    const release = parseReleaseLinks(readFileSync("data/propublica/ndc_fei.csv", "utf8"));
    const labelsByNdc = new Map<string, Label[]>();
    for (const label of labels) labelsByNdc.set(label.productNdc ?? "", [...(labelsByNdc.get(label.productNdc ?? "") ?? []), label]);
    const missingLinks: string[] = [];
    const missingFacilities = new Set<string>();
    let matchedNdcs = 0;
    for (const [ndc, links] of release) {
      const matches = labelsByNdc.get(ndc);
      if (matches) matchedNdcs++;
      for (const link of links) {
        if (!feis.has(link.fei)) missingFacilities.add(link.fei);
        if (matches && !matches.every((l) => l.feis.includes(link.fei))) missingLinks.push(`${ndc}→${link.fei}`);
        if (matches && link.api && !matches.every((l) => l.apiFeis.includes(link.fei))) missingLinks.push(`api ${ndc}→${link.fei}`);
      }
    }
    expect([...missingFacilities]).toEqual([]);
    expect(missingLinks).toEqual([]);
    expect(matchedNdcs / release.size).toBeGreaterThan(0.995);
  });

  it("geocodes nearly every facility, mostly at postal or city precision", () => {
    const located = facilities.filter((f) => f.lat !== null && f.lon !== null);
    const precise = facilities.filter((f) => f.precision === "postal" || f.precision === "city");
    expect(located.length / facilities.length).toBeGreaterThan(0.99);
    expect(precise.length / facilities.length).toBeGreaterThan(0.85);
    for (const f of located) {
      expect(Math.abs(f.lat!)).toBeLessThanOrEqual(90);
      expect(Math.abs(f.lon!)).toBeLessThanOrEqual(180);
    }
  });

  it("keeps facility detail files consistent with their summaries", () => {
    for (const fei of [...feis].slice(0, 200)) {
      const detail = read<FacilityDetail>(`facilities/${fei}.json`);
      expect(detail.summary.fei).toBe(fei);
      expect(detail.inspections.length).toBe(detail.summary.inspections);
      expect(detail.warningLetters.length).toBe(detail.summary.warningLetters);
      expect(detail.inspections.every((i, n, all) => n === 0 || all[n - 1].date >= i.date)).toBe(true);
    }
  });

  it("aggregates insights that agree with the facility list", () => {
    const statusTotal = Object.values(insights.statusCounts).reduce((a, b) => a + b, 0);
    expect(statusTotal).toBe(facilities.length);
    expect(insights.byCountry.reduce((n, c) => n + c.facilities, 0)).toBe(facilities.length);
  });
});
