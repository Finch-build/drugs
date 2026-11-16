import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nodeData } from "./lib/devalue";
import { createLimiter, ingredientQueries, searchPages, splitList, SEARCH_CAP } from "./lib/queue";
import { parseReleaseLinks, releaseFeis } from "./lib/release";

const ORIGIN = "https://projects.propublica.org/rx-inspector";
const RAW_DIR = "data/raw";
const RELEASE_CSV = "data/propublica/ndc_fei.csv";
const CACHE_DIR = join(RAW_DIR, "http");
const PAGE_SIZE = 12;
const CONCURRENCY = Number(process.env.CRAWL_CONCURRENCY ?? 4);
const USER_AGENT = "rx-mission-control-snapshot/1.0 (static research mirror; polite crawler)";

const SEED_DRUGS = [
  "atorvastatin", "metformin", "lisinopril", "amlodipine", "levothyroxine", "omeprazole", "simvastatin", "losartan",
  "gabapentin", "hydrochlorothiazide", "sertraline", "metoprolol", "montelukast", "escitalopram", "rosuvastatin",
  "bupropion", "furosemide", "pantoprazole", "trazodone", "fluoxetine", "tamsulosin", "meloxicam", "clopidogrel",
  "citalopram", "prednisone", "carvedilol", "duloxetine", "tramadol", "venlafaxine", "allopurinol", "warfarin",
  "pravastatin", "alprazolam", "cyclobenzaprine", "zolpidem", "glipizide", "spironolactone", "oxycodone",
  "amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline", "cephalexin", "valsartan", "topiramate",
  "lamotrigine", "quetiapine", "aripiprazole", "risperidone", "olanzapine", "clonazepam", "lorazepam", "propranolol",
  "diltiazem", "insulin", "heparin", "ondansetron", "famotidine", "ibuprofen", "naproxen", "acetaminophen",
  "tacrolimus", "mycophenolate", "methotrexate", "hydroxychloroquine", "levetiracetam", "buspirone", "donepezil",
  "finasteride", "sildenafil", "tadalafil", "estradiol", "progesterone", "testosterone", "sumatriptan", "baclofen",
  "methylphenidate", "amphetamine", "lithium", "phentermine", "nitrofurantoin", "fluconazole", "valacyclovir",
  "acyclovir", "dexamethasone", "ketorolac", "lidocaine", "morphine", "fentanyl", "hydrocodone", "buprenorphine",
  "naloxone", "vancomycin", "ceftriaxone", "enoxaparin", "apixaban", "rivaroxaban", "dabigatran", "entecavir",
];

const SEED_FACILITY_TERMS = [
  "pharma", "pharmaceuticals", "laboratories", "labs", "limited", "inc", "llc", "gmbh", "spa", "co ltd", "india",
  "china", "germany", "italy", "spain", "france", "japan", "korea", "canada", "mexico", "israel", "ireland",
  "switzerland", "puerto rico", "brazil", "taiwan", "singapore", "hungary", "poland", "portugal", "netherlands",
  "belgium", "denmark", "sweden", "austria", "czech", "slovenia", "croatia", "greece", "turkey", "jordan",
  "bangladesh", "pakistan", "vietnam", "thailand", "indonesia", "malaysia", "australia", "argentina", "uruguay",
  "teva", "sun", "aurobindo", "cipla", "lupin", "zydus", "dr reddys", "glenmark", "torrent", "alembic", "hetero",
  "mylan", "viatris", "sandoz", "apotex", "amneal", "hikma", "fresenius", "pfizer", "baxter", "macleods", "unichem",
];

interface Label {
  id: number;
  feis: string | null;
  ingredients: string | null;
  labeler: string | null;
  [key: string]: unknown;
}

interface FacilityDetail {
  fei: string;
  labels: Label[];
  [key: string]: unknown;
}

const limit = createLimiter(CONCURRENCY);
let requestCount = 0;
let cacheHits = 0;

async function fetchData<T>(path: string): Promise<T | null> {
  const url = `${ORIGIN}${path}`;
  const key = createHash("sha1").update(url).digest("hex");
  const cachePath = join(CACHE_DIR, `${key}.json`);
  if (existsSync(cachePath)) {
    cacheHits++;
    return nodeData<T>(JSON.parse(readFileSync(cachePath, "utf8")));
  }
  return limit(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        writeFileSync(cachePath, text);
        requestCount++;
        await sleep(150);
        return nodeData<T>(JSON.parse(text));
      } catch (error) {
        const wait = 1000 * 2 ** attempt;
        console.warn(`retry ${attempt + 1} ${path}: ${(error as Error).message}; waiting ${wait}ms`);
        await sleep(wait);
      }
    }
    console.error(`giving up on ${path}`);
    return null;
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const labels = new Map<number, Label>();
const facilities = new Map<string, FacilityDetail>();
const seenFeis = new Set<string>();
const seenQueries = new Set<string>();
const cappedQueries: string[] = [];

function absorbLabel(label: Label, pending: Promise<unknown>[]) {
  const existing = labels.get(label.id);
  labels.set(label.id, { ...existing, ...label });
  for (const fei of splitList(label.feis)) queueFacility(fei, pending);
  for (const name of ingredientQueries(label.ingredients)) queueSearch(`name=${encodeURIComponent(name)}`, pending);
  if (label.labeler) queueSearch(`labeler=${encodeURIComponent(label.labeler)}`, pending);
}

function queueFacility(fei: string, pending: Promise<unknown>[]) {
  if (seenFeis.has(fei)) return;
  seenFeis.add(fei);
  pending.push(
    fetchData<FacilityDetail>(`/facilities/${encodeURIComponent(fei)}/__data.json`).then((detail) => {
      if (!detail) return;
      facilities.set(fei, detail);
      for (const label of detail.labels ?? []) absorbLabel(label, pending);
    }),
  );
}

function queueSearch(query: string, pending: Promise<unknown>[]) {
  if (seenQueries.has(query)) return;
  seenQueries.add(query);
  pending.push(
    fetchData<{ result: Label[] | null; total_records: number }>(`/search/__data.json?${query}`).then((page) => {
      if (!page) return;
      for (const label of page.result ?? []) absorbLabel(label, pending);
      if (page.total_records >= SEARCH_CAP) cappedQueries.push(query);
      for (const n of searchPages(page.total_records ?? 0, PAGE_SIZE)) {
        pending.push(
          fetchData<{ result: Label[] | null }>(`/search/__data.json?${query}&page=${n}`).then((next) => {
            for (const label of next?.result ?? []) absorbLabel(label, pending);
          }),
        );
      }
    }),
  );
}

function queueFacilitySearch(term: string, pending: Promise<unknown>[]) {
  pending.push(
    fetchData<{ facilities: Array<{ fei: string }> }>(`/facilities/__data.json?q=${encodeURIComponent(term)}`).then(
      (res) => {
        for (const f of res?.facilities ?? []) queueFacility(f.fei, pending);
      },
    ),
  );
}

async function drain(pending: Promise<unknown>[]) {
  let settled = 0;
  while (settled < pending.length) {
    const batch = pending.slice(settled);
    await Promise.all(batch);
    settled += batch.length;
    console.log(
      `progress: labels=${labels.size} facilities=${facilities.size} queries=${seenQueries.size} requests=${requestCount} cached=${cacheHits}`,
    );
  }
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const pending: Promise<unknown>[] = [];
  for (const drug of SEED_DRUGS) queueSearch(`name=${encodeURIComponent(drug)}`, pending);
  for (const term of SEED_FACILITY_TERMS) queueFacilitySearch(term, pending);
  if (existsSync(RELEASE_CSV)) {
    for (const fei of releaseFeis(parseReleaseLinks(readFileSync(RELEASE_CSV, "utf8")))) queueFacility(fei, pending);
  }
  await drain(pending);

  const snapshot = {
    crawledAt: new Date().toISOString(),
    source: `${ORIGIN}/`,
    labels: [...labels.values()].sort((a, b) => a.id - b.id),
    facilities: [...facilities.values()],
    cappedQueries,
  };
  writeFileSync(join(RAW_DIR, "snapshot.json"), JSON.stringify(snapshot));
  console.log(`done: ${snapshot.labels.length} labels, ${snapshot.facilities.length} facilities, ${requestCount} requests`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
