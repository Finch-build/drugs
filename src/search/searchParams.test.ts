import { describeSearch, hasSearch, readLabelSearch, toggleFilterValue, writeLabelSearch } from "./searchParams";

describe("readLabelSearch", () => {
  it("reads search fields, page, advanced flag and repeated facet filters", () => {
    const state = readLabelSearch(new URLSearchParams("name=metformin&labeler=zydus&page=3&advanced=true&doses=500mg&doses=1000mg&colors=white&bogus=1"));
    expect(state).toEqual({
      name: "metformin",
      labeler: "zydus",
      ndc: "",
      q: "",
      advanced: true,
      page: 3,
      filters: { doses: ["500mg", "1000mg"], colors: ["white"] },
    });
  });

  it("defaults the page to 1", () => expect(readLabelSearch(new URLSearchParams("page=abc")).page).toBe(1));
});

describe("writeLabelSearch", () => {
  it("omits empty values and page 1, and repeats filter values", () => {
    const params = writeLabelSearch({ name: "metformin", labeler: "", ndc: "", q: "", advanced: false, page: 1, filters: { doses: ["500mg", "1000mg"] } });
    expect(params.toString()).toBe("name=metformin&doses=500mg&doses=1000mg");
  });

  it("round-trips", () => {
    const query = "q=%22teva%22+AND+20mg&advanced=true&page=2&forms=TABLET";
    expect(writeLabelSearch(readLabelSearch(new URLSearchParams(query))).toString()).toBe(query);
  });
});

describe("toggleFilterValue", () => {
  it("adds and removes values, dropping empty keys", () => {
    const added = toggleFilterValue({}, "doses", "500mg");
    expect(added).toEqual({ doses: ["500mg"] });
    expect(toggleFilterValue(added, "doses", "500mg")).toEqual({});
  });
});

describe("hasSearch / describeSearch", () => {
  const base = readLabelSearch(new URLSearchParams());
  it("detects an empty search", () => {
    expect(hasSearch(base)).toBe(false);
    expect(hasSearch({ ...base, ndc: "123" })).toBe(true);
  });
  it("describes the search in words", () => {
    expect(describeSearch({ ...base, name: "metformin", labeler: "zydus" })).toBe("“metformin” from “zydus”");
    expect(describeSearch({ ...base, ndc: "63629-8484-1" })).toBe("NDC “63629-8484-1”");
    expect(describeSearch({ ...base, q: "a OR b" })).toBe("“a OR b”");
  });
});
