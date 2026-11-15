import { SEARCH_COPY } from "../../content/copy";

export interface ExampleSearch {
  text: string;
  params: Record<string, string>;
}

const EXPLICIT: Record<string, Record<string, string>> = {
  "Hikma Pharmaceuticals Cefazolin": { name: "Cefazolin", labeler: "Hikma Pharmaceuticals" },
  "Quallent Atorvastatin": { name: "Atorvastatin", labeler: "Quallent" },
  Apotex: { labeler: "Apotex" },
};

export function exampleParams(text: string): Record<string, string> {
  if (EXPLICIT[text]) return EXPLICIT[text];
  if (/^[\d\s-]+$/.test(text)) return { ndc: text };
  return { name: text };
}

export const EXAMPLE_SEARCHES: ExampleSearch[] = SEARCH_COPY.examples.map((text) => ({ text, params: exampleParams(text) }));

export function searchHref(params: Record<string, string>): string {
  return `/search?${new URLSearchParams(params).toString()}`;
}
