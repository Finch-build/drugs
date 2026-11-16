import { describe, expect, it } from "vitest";
import type { Label } from "../data/types";
import { applyFilters, buildFacets, createLabelIndex, normalizeNdc, sameFacilities, searchLabels } from "./labels";

const label = (overrides: Partial<Label>): Label => ({
  id: 1,
  documentId: "doc",
  labeler: "Teva Pharmaceuticals USA",
  labelerRole: null,
  name: "Atorvastatin Calcium",
  ingredients: "ATORVASTATIN CALCIUM",
  form: "TABLET, FILM COATED",
  dose: "10mg",
  route: "ORAL",
  package: "BOTTLE",
  packageAmount: "90",
  anda: "ANDA-1",
  nda: null,
  bla: null,
  productNdc: "0093-5056",
  ndcs: ["0093-5056-98", "0093-5056-19"],
  repackNdc: null,
  feis: ["111"],
  apiFeis: [],
  colors: ["white"],
  colorsLong: [],
  shapes: ["OVAL"],
  flavors: [],
  imprints: ["93 7155"],
  authorizedGeneric: false,
  ...overrides,
});

const labels = [
  label({ id: 1 }),
  label({ id: 2, dose: "20mg", ndcs: ["0093-5057-98"], productNdc: "0093-5057", imprints: ["93 7156"] }),
  label({ id: 3, labeler: "Quallent Pharmaceuticals", feis: ["222"], productNdc: "82009-001", ndcs: ["82009-001-90"], shapes: ["ROUND"] }),
  label({ id: 4, name: "Bupropion XL", ingredients: "BUPROPION HYDROCHLORIDE", labeler: "Apotex", feis: [], productNdc: "60505-1", ndcs: ["60505-0001-1"], form: "TABLET, EXTENDED RELEASE", dose: "150mg" }),
];

const index = createLabelIndex(labels);

describe("normalizeNdc", () => {
  it("strips the NDC prefix, spaces and punctuation other than hyphens", () => {
    expect(normalizeNdc("NDC 0143-9579-25")).toBe("0143-9579-25");
    expect(normalizeNdc(" 63629 8484 1 ")).toBe("63629-8484-1");
  });
});

describe("searchLabels (guided)", () => {
  it("finds labels by drug name prefix", () => {
    expect(searchLabels(index, { name: "atorva" }).map((l) => l.id)).toEqual([1, 2, 3]);
  });

  it("narrows by company", () => {
    expect(searchLabels(index, { name: "atorvastatin", labeler: "quallent" }).map((l) => l.id)).toEqual([3]);
  });

  it("finds labels by package NDC with or without hyphens", () => {
    expect(searchLabels(index, { ndc: "0093-5057-98" }).map((l) => l.id)).toEqual([2]);
    expect(searchLabels(index, { ndc: "0093505798" }).map((l) => l.id)).toEqual([2]);
    expect(searchLabels(index, { ndc: "0093-5056" }).map((l) => l.id)).toEqual([1]);
  });

  it("matches an 11-digit NDC against 10-digit NDCs padded with a zero", () => {
    expect(searchLabels(index, { ndc: "60505-0001-01" }).map((l) => l.id)).toEqual([4]);
  });

  it("runs advanced queries across all fields", () => {
    expect(searchLabels(index, { q: "atorvastatin -quallent 20mg OR bupropion" }).map((l) => l.id)).toEqual([2, 4]);
    expect(searchLabels(index, { q: '"93 7156"' }).map((l) => l.id)).toEqual([2]);
  });

  it("ranks name matches above labeler-only matches", () => {
    const extra = createLabelIndex([
      label({ id: 10, name: "Teva Cream", ingredients: "UREA", labeler: "Atorva Labs" }),
      label({ id: 11 }),
    ]);
    expect(searchLabels(extra, { q: "atorva" }).map((l) => l.id)).toEqual([11, 10]);
  });

  it("returns nothing for an empty search", () => {
    expect(searchLabels(index, {})).toEqual([]);
  });
});

describe("buildFacets and applyFilters", () => {
  const results = searchLabels(index, { name: "atorvastatin" });

  it("counts facet values across results", () => {
    const facets = buildFacets(results);
    expect(facets.doses).toEqual([
      { value: "10mg", count: 2 },
      { value: "20mg", count: 1 },
    ]);
    expect(facets.shapes).toEqual([
      { value: "OVAL", count: 2 },
      { value: "ROUND", count: 1 },
    ]);
    expect(facets.imprints.map((f) => f.value)).toEqual(["93 7155", "93 7156"]);
  });

  it("filters with AND across facets and OR within one facet", () => {
    expect(applyFilters(results, { doses: ["10mg"], shapes: ["ROUND"] }).map((l) => l.id)).toEqual([3]);
    expect(applyFilters(results, { doses: ["10mg", "20mg"] }).map((l) => l.id)).toEqual([1, 2, 3]);
  });
});

describe("sameFacilities", () => {
  it("is true when every result shares one facility set", () => {
    expect(sameFacilities([labels[0], labels[1]])).toBe(true);
    expect(sameFacilities([labels[0], labels[2]])).toBe(false);
    expect(sameFacilities([labels[3]])).toBe(false);
  });
});
