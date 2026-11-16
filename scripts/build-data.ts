import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Meta } from "../src/data/types";
import { loadGazetteer } from "./lib/gazetteer";
import { createGeocoder, geoCountry } from "./lib/geocode";
import { applyReleaseLinks, parseReleaseLinks } from "./lib/release";
import { buildInsights, toFacilityDetail, toLabel, type RawFacilityDetail, type RawLabel } from "./lib/transform";

const RAW = process.env.SNAPSHOT ?? "data/raw/snapshot.json";
const GEO_DIR = "data/geo";
const OUT = "public/data";
const RELEASE_CSV = "data/propublica/ndc_fei.csv";

interface Snapshot {
  crawledAt: string;
  source: string;
  labels: RawLabel[];
  facilities: RawFacilityDetail[];
}

const write = (path: string, value: unknown) => writeFileSync(join(OUT, path), JSON.stringify(value));

async function main() {
  const snapshot: Snapshot = JSON.parse(readFileSync(RAW, "utf8"));
  const countryCodes = new Set(
    snapshot.facilities.flatMap((f) => f.facilities.map((a) => geoCountry(a.country_alpha2 ?? null, a.state ?? null)).filter((c): c is string => Boolean(c))),
  );
  const geocode = createGeocoder(await loadGazetteer(GEO_DIR, countryCodes));

  const releaseLinks = parseReleaseLinks(readFileSync(RELEASE_CSV, "utf8"));
  const labels = applyReleaseLinks(snapshot.labels.map(toLabel), releaseLinks).sort((a, b) => a.id - b.id);
  const details = snapshot.facilities.map((f) => toFacilityDetail(f, geocode)).sort((a, b) => a.summary.fei.localeCompare(b.summary.fei));
  const insights = buildInsights(details, labels);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "facilities"), { recursive: true });
  for (const detail of details) write(`facilities/${detail.summary.fei}.json`, detail);
  write("facilities.json", details.map((d) => d.summary));
  write("labels.json", labels);
  write("insights.json", insights);

  const sum = (pick: (d: (typeof details)[number]) => number) => details.reduce((n, d) => n + pick(d), 0);
  const meta: Meta = {
    crawledAt: snapshot.crawledAt,
    builtAt: new Date().toISOString(),
    source: snapshot.source,
    counts: {
      labels: labels.length,
      labelsWithFacility: labels.filter((l) => l.feis.length > 0).length,
      facilities: details.length,
      countries: insights.byCountry.length,
      inspections: sum((d) => d.inspections.length),
      citations: sum((d) => d.summary.citations),
      warningLetters: sum((d) => d.warningLetters.length),
      letter483s: sum((d) => d.letter483s.length),
      importAlerts: sum((d) => d.importAlerts.length),
    },
  };
  write("meta.json", meta);

  const precision = new Map<string, number>();
  for (const d of details) precision.set(d.summary.precision ?? "none", (precision.get(d.summary.precision ?? "none") ?? 0) + 1);
  console.log(JSON.stringify(meta.counts), Object.fromEntries(precision));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
