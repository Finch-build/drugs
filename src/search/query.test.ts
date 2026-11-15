import { describe, expect, it } from "vitest";
import { compileQuery, parseQuery, toHaystack } from "./query";

const doc = (text: string) => toHaystack([text]);

describe("parseQuery", () => {
  it("parses implicit AND between words", () => {
    expect(parseQuery("quallent atorvastatin")).toEqual({
      type: "and",
      children: [
        { type: "term", value: "quallent", exact: false, prefix: true },
        { type: "term", value: "atorvastatin", exact: false, prefix: true },
      ],
    });
  });

  it("parses OR, NOT, required and groups", () => {
    expect(parseQuery("(bryant OR remedyrepack) AND teva -dextro +tablet")).toEqual({
      type: "and",
      children: [
        {
          type: "or",
          children: [
            { type: "term", value: "bryant", exact: false, prefix: true },
            { type: "term", value: "remedyrepack", exact: false, prefix: true },
          ],
        },
        { type: "term", value: "teva", exact: false, prefix: true },
        { type: "not", child: { type: "term", value: "dextro", exact: false, prefix: true } },
        { type: "term", value: "tablet", exact: false, prefix: true },
      ],
    });
  });

  it("parses exact phrases and quoted prefixes", () => {
    expect(parseQuery('"teva pharmaceuticals usa"')).toEqual({ type: "term", value: "teva pharmaceuticals usa", exact: true, prefix: false });
    expect(parseQuery('"0378-39"*')).toEqual({ type: "term", value: "0378-39", exact: true, prefix: true });
  });

  it("returns null for empty or operator-only input", () => {
    expect(parseQuery("   ")).toBeNull();
    expect(parseQuery("OR AND")).toBeNull();
  });

  it("tolerates unbalanced parentheses and quotes", () => {
    expect(parseQuery("(metformin")).toEqual({ type: "term", value: "metformin", exact: false, prefix: true });
    expect(parseQuery('"metformin')).toEqual({ type: "term", value: "metformin", exact: true, prefix: false });
  });
});

describe("compileQuery", () => {
  const match = (q: string, text: string) => compileQuery(q)!(doc(text));

  it("matches word prefixes at token boundaries", () => {
    expect(match("metf", "Metformin Hydrochloride")).toBe(true);
    expect(match("formin", "Metformin Hydrochloride")).toBe(false);
  });

  it("requires all terms by default", () => {
    expect(match("hikma cefazolin", "Cefazolin Hikma Pharmaceuticals")).toBe(true);
    expect(match("hikma cefazolin", "Cefazolin Sandoz")).toBe(false);
  });

  it("supports exact phrase matching", () => {
    expect(match('"teva pharmaceuticals usa"', "Teva Pharmaceuticals USA, Inc.")).toBe(true);
    expect(match('"teva usa"', "Teva Pharmaceuticals USA")).toBe(false);
    expect(match('"teva pharm"', "Teva Pharmaceuticals USA")).toBe(false);
  });

  it("supports OR, exclusion and grouping", () => {
    expect(match("500mg OR 250mg", "Amoxicillin 250mg")).toBe(true);
    expect(match("amphetamine -dextroamphetamine", "Dextroamphetamine Amphetamine")).toBe(false);
    expect(match("amphetamine -dextroamphetamine", "Amphetamine Sulfate")).toBe(true);
    expect(match("(bryant OR remedyrepack) AND teva", "RemedyRepack Teva")).toBe(true);
    expect(match("(bryant OR remedyrepack) AND teva", "Bryant Ranch Mylan")).toBe(false);
  });

  it("supports quoted NDC prefixes", () => {
    expect(match('"0378-39"*', "0378-3952-01 0378-3952-10")).toBe(true);
    expect(match('"0378-39"*', "0378-4001-01")).toBe(false);
  });

  it("returns null when there is nothing to match", () => {
    expect(compileQuery("")).toBeNull();
  });
});
