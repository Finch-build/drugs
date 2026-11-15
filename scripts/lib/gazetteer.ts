import { createReadStream, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { normalizePlace, type Gazetteer, type LatLon } from "./geocode";

class Averager {
  private sums = new Map<string, [number, number, number]>();
  add(key: string, lat: number, lon: number, weight = 1) {
    const s = this.sums.get(key) ?? [0, 0, 0];
    s[0] += lat * weight;
    s[1] += lon * weight;
    s[2] += weight;
    this.sums.set(key, s);
  }
  toMap(): Map<string, LatLon> {
    return new Map([...this.sums].map(([k, [lat, lon, w]]) => [k, [lat / w, lon / w] as LatLon]));
  }
}

async function eachLine(path: string, fn: (cols: string[]) => void) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) if (line && !line.startsWith("#")) fn(line.split("\t"));
}

export async function loadGazetteer(dir: string, countries: Set<string>): Promise<Gazetteer> {
  const postal = new Averager();
  await eachLine(join(dir, "postal/allCountries.txt"), (c) => {
    if (!countries.has(c[0])) return;
    const key = `${c[0]}|${c[1].toUpperCase()}`;
    postal.add(key, Number(c[9]), Number(c[10]));
    postal.add(`${c[0]}|${c[1].toUpperCase().replace(/\s+/g, "")}`, Number(c[9]), Number(c[10]));
  });

  const cities = new Map<string, { coords: LatLon; pop: number; primary: boolean }>();
  const regionAvg = new Averager();
  const countryAvg = new Averager();
  const putCity = (key: string, coords: LatLon, pop: number, primary: boolean) => {
    const existing = cities.get(key);
    if (!existing || (primary && !existing.primary) || (primary === existing.primary && pop > existing.pop)) {
      cities.set(key, { coords, pop, primary });
    }
  };
  await eachLine(join(dir, "cities500.txt"), (c) => {
    const country = c[8];
    const lat = Number(c[4]);
    const lon = Number(c[5]);
    const pop = Number(c[14]) || 1;
    countryAvg.add(country, lat, lon, Math.sqrt(pop));
    if (!countries.has(country)) return;
    regionAvg.add(`${country}.${c[10]}`, lat, lon, Math.sqrt(pop));
    for (const name of [c[1], c[2]]) putCity(`${country}|${normalizePlace(name)}`, [lat, lon], pop, true);
    if (pop >= 15000) for (const alt of c[3].split(",")) if (alt) putCity(`${country}|${normalizePlace(alt)}`, [lat, lon], pop, false);
  });

  const regionCentroids = regionAvg.toMap();
  const regions = new Map<string, LatLon>();
  for (const line of readFileSync(join(dir, "dump_admin1CodesASCII.txt"), "utf8").split("\n")) {
    const [code, name, ascii] = line.split("\t");
    const centroid = code && regionCentroids.get(code);
    if (!centroid) continue;
    const country = code.split(".")[0];
    for (const n of [name, ascii]) regions.set(`${country}|${normalizePlace(n)}`, centroid);
  }

  return {
    postal: postal.toMap(),
    cities: new Map([...cities].map(([k, v]) => [k, v.coords])),
    regions,
    countries: countryAvg.toMap(),
  };
}
