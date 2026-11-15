import { fixtureFacilities, makeSummary } from "./fixtures";
import {
  countryName,
  facilityFilterOptions,
  facilityLocation,
  readFacilityQuery,
  searchFacilities,
  writeFacilityQuery,
  DEFAULT_FACILITY_QUERY,
} from "./facilities";

const names = (list: { name: string }[]) => list.map((f) => f.name);

describe("countryName / facilityLocation", () => {
  it("normalises 3-letter country codes using the ISO code", () => {
    expect(countryName(makeSummary({ country: "USA", countryCode: "US" }))).toBe("United States");
    expect(countryName(makeSummary({ country: "India", countryCode: null }))).toBe("India");
  });
  it("joins city, state and country", () => {
    expect(facilityLocation(fixtureFacilities[0])).toBe("Halol, Gujarat, India");
    expect(facilityLocation(fixtureFacilities[3])).toBe("Canada");
  });
});

describe("read/writeFacilityQuery", () => {
  it("reads defaults", () => expect(readFacilityQuery(new URLSearchParams())).toEqual(DEFAULT_FACILITY_QUERY));
  it("ignores invalid sort and status values", () => {
    const q = readFacilityQuery(new URLSearchParams("sort=bad&status=nope&page=2&country=India"));
    expect(q).toMatchObject({ sort: "name", status: "", page: 2, country: "India" });
  });
  it("round-trips and omits defaults", () => {
    const params = "q=sun&country=India&status=vai&operation=PACK&sort=oai&page=3";
    expect(writeFacilityQuery(readFacilityQuery(new URLSearchParams(params))).toString()).toBe(params);
    expect(writeFacilityQuery(DEFAULT_FACILITY_QUERY).toString()).toBe("");
  });
});

describe("searchFacilities", () => {
  const run = (patch: Partial<typeof DEFAULT_FACILITY_QUERY>) => searchFacilities(fixtureFacilities, { ...DEFAULT_FACILITY_QUERY, ...patch });

  it("sorts by name by default", () => {
    expect(names(run({}))).toEqual(["Acme Unknown Works", "Bausch & Lomb Incorporated", "Intas Pharmaceuticals Limited", "Sun Pharmaceutical Industries Limited"]);
  });
  it("matches text across name, FEI, city, state and country", () => {
    expect(names(run({ q: "tampa" }))).toEqual(["Bausch & Lomb Incorporated"]);
    expect(names(run({ q: "3003157498" }))).toEqual(["Intas Pharmaceuticals Limited"]);
    expect(names(run({ q: "gujarat -intas" }))).toEqual(["Sun Pharmaceutical Industries Limited"]);
    expect(names(run({ q: "united states" }))).toEqual(["Bausch & Lomb Incorporated"]);
  });
  it("filters by normalised country, status and operation", () => {
    expect(run({ country: "India" })).toHaveLength(2);
    expect(names(run({ country: "United States" }))).toEqual(["Bausch & Lomb Incorporated"]);
    expect(names(run({ status: "vai" }))).toEqual(["Intas Pharmaceuticals Limited"]);
    expect(names(run({ operation: "PACK" }))).toEqual(["Intas Pharmaceuticals Limited"]);
  });
  it("sorts by recent action with missing dates last", () => {
    expect(names(run({ sort: "recent" }))[0]).toBe("Sun Pharmaceutical Industries Limited");
    expect(names(run({ sort: "recent" })).at(-1)).toBe("Acme Unknown Works");
  });
  it("sorts by inspections, OAI and products descending", () => {
    expect(names(run({ sort: "inspections" }))[0]).toBe("Bausch & Lomb Incorporated");
    expect(names(run({ sort: "oai" }))[0]).toBe("Bausch & Lomb Incorporated");
    expect(names(run({ sort: "products" }))[0]).toBe("Bausch & Lomb Incorporated");
  });
});

describe("facilityFilterOptions", () => {
  it("counts countries, statuses and operations", () => {
    const options = facilityFilterOptions(fixtureFacilities);
    expect(options.countries[0]).toEqual({ value: "India", count: 2 });
    expect(options.countries.map((c) => c.value)).toContain("United States");
    expect(options.statuses.find((s) => s.value === "vai")).toEqual({ value: "vai", count: 1 });
    expect(options.operations.find((o) => o.value === "MANUFACTURE")?.count).toBe(3);
  });
});
