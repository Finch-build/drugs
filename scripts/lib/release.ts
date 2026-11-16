import type { Label } from "../../src/data/types";

export interface ReleaseLink {
  fei: string;
  registrant: string;
  country: string;
  api: boolean;
  method: string;
}

export type ReleaseLinks = Map<string, ReleaseLink[]>;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

const REQUIRED_COLUMNS = ["ndc", "fei", "registrant", "country", "linkage_method", "api_mfr"];

export function parseReleaseLinks(csv: string): ReleaseLinks {
  const [header, ...rows] = parseCsv(csv);
  const column = Object.fromEntries(header.map((name, i) => [name.trim(), i]));
  const missing = REQUIRED_COLUMNS.filter((name) => !(name in column));
  if (missing.length) throw new Error(`release CSV is missing columns: ${missing.join(", ")}`);

  const links: ReleaseLinks = new Map();
  for (const row of rows) {
    const ndc = row[column.ndc]?.trim();
    const fei = row[column.fei]?.trim();
    if (!ndc || !fei) continue;
    const list = links.get(ndc) ?? [];
    if (!list.some((l) => l.fei === fei)) {
      list.push({
        fei,
        registrant: row[column.registrant] ?? "",
        country: row[column.country] ?? "",
        api: row[column.api_mfr]?.trim().toUpperCase() === "TRUE",
        method: row[column.linkage_method] ?? "",
      });
    }
    links.set(ndc, list);
  }
  return links;
}

export function applyReleaseLinks(labels: Label[], links: ReleaseLinks): Label[] {
  return labels.map((label) => {
    const release = (label.productNdc && links.get(label.productNdc)) || [];
    return {
      ...label,
      feis: [...new Set([...label.feis, ...release.map((l) => l.fei)])],
      apiFeis: release.filter((l) => l.api).map((l) => l.fei),
    };
  });
}

export function releaseFeis(links: ReleaseLinks): string[] {
  return [...new Set([...links.values()].flatMap((list) => list.map((l) => l.fei)))];
}
