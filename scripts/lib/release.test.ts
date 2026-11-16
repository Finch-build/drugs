import { describe, expect, it } from "vitest";
import type { Label } from "../../src/data/types";
import { applyReleaseLinks, parseCsv, parseReleaseLinks } from "./release";

describe("parseCsv", () => {
  it("handles quoted fields with commas, quotes and CRLF line endings", () => {
    expect(parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\r\n2,,\n')).toEqual([
      ["a", "b", "c"],
      ["1", "x, y", 'say "hi"'],
      ["2", "", ""],
    ]);
  });
});

describe("parseReleaseLinks", () => {
  it("groups facility links by product NDC with API and linkage details", () => {
    const csv = [
      "ndc,fei,registrant,country,anda,nda,bla,linkage_method,api_mfr",
      '0228-3090,2211563,"Actavis, LLC",US,ANDA-079040,,,ADDRESS_MATCH,',
      "0228-3090,3002806523,Api Co,IN,ANDA-079040,,,SPL_DUNS_FEI,TRUE",
      "0093-1,111,Teva,US,,,,SPL_DUNS_FEI,FALSE",
    ].join("\n");
    const links = parseReleaseLinks(csv);
    expect(links.get("0228-3090")).toEqual([
      { fei: "2211563", registrant: "Actavis, LLC", country: "US", api: false, method: "ADDRESS_MATCH" },
      { fei: "3002806523", registrant: "Api Co", country: "IN", api: true, method: "SPL_DUNS_FEI" },
    ]);
    expect(links.get("0093-1")?.[0].api).toBe(false);
  });

  it("rejects a file without the expected columns", () => {
    expect(() => parseReleaseLinks("foo,bar\n1,2")).toThrow(/ndc/);
  });
});

describe("applyReleaseLinks", () => {
  const base = { productNdc: "0228-3090", feis: [] as string[] } as unknown as Label;
  const links = parseReleaseLinks(
    ["ndc,fei,registrant,country,anda,nda,bla,linkage_method,api_mfr", "0228-3090,222,A,US,,,,ADDRESS_MATCH,", "0228-3090,333,B,IN,,,,SPL_DUNS_FEI,TRUE"].join("\n"),
  );

  it("adds release facilities and API makers to labels by product NDC", () => {
    const [label] = applyReleaseLinks([{ ...base, feis: ["111", "222"] }], links);
    expect(label.feis).toEqual(["111", "222", "333"]);
    expect(label.apiFeis).toEqual(["333"]);
  });

  it("leaves labels without a release entry unchanged apart from an empty API list", () => {
    const [label] = applyReleaseLinks([{ ...base, productNdc: "9999-1", feis: ["111"] }], links);
    expect(label.feis).toEqual(["111"]);
    expect(label.apiFeis).toEqual([]);
  });
});
