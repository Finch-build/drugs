import { describe, expect, it } from "vitest";
import { createGeocoder, geoCountry, normalizePlace, postalKeys } from "./geocode";

const geocoder = createGeocoder({
  postal: new Map([
    ["US|08540", [40.35, -74.66]],
    ["IN|500043", [17.55, 78.45]],
    ["CA|K1A", [45.4, -75.7]],
  ]),
  cities: new Map([
    ["IN|hyderabad", [17.38, 78.48]],
    ["DE|munchen", [48.13, 11.57]],
  ]),
  regions: new Map([["IN|telangana", [17.9, 79.1]]]),
  countries: new Map([
    ["IN", [21, 78]],
    ["CN", [35, 103]],
  ]),
});

describe("normalizePlace", () => {
  it("lower-cases, strips accents, punctuation and administrative suffixes", () => {
    expect(normalizePlace("München")).toBe("munchen");
    expect(normalizePlace("Medchal-Malkajgiri District")).toBe("medchal malkajgiri");
    expect(normalizePlace("  St. Louis, ")).toBe("st louis");
  });
});

describe("postalKeys", () => {
  it("tries the full code then shorter forms", () => {
    expect(postalKeys("US", "08540-1234")).toEqual(["US|08540-1234", "US|08540"]);
    expect(postalKeys("CA", "K1A 0B1")).toEqual(["CA|K1A 0B1", "CA|K1A0B1", "CA|K1A"]);
    expect(postalKeys("US", "8540")).toEqual(["US|8540", "US|08540"]);
    expect(postalKeys("IN", null)).toEqual([]);
  });
});

describe("createGeocoder", () => {
  it("prefers postal code matches", () => {
    expect(geocoder({ country: "US", zip: "08540-1234", city: "Princeton", state: "NJ" })).toEqual({
      lat: 40.35,
      lon: -74.66,
      precision: "postal",
    });
  });

  it("falls back to city, then region, then country", () => {
    expect(geocoder({ country: "DE", zip: "99999", city: "München", state: null })?.precision).toBe("city");
    expect(geocoder({ country: "IN", zip: null, city: "Nowhere", state: "Telangana" })?.precision).toBe("region");
    expect(geocoder({ country: "CN", zip: null, city: "Unknown", state: "Unknown" })).toEqual({
      lat: 35,
      lon: 103,
      precision: "country",
    });
  });

  it("matches a city name embedded in a longer address field", () => {
    expect(geocoder({ country: "IN", zip: null, city: "Hyderabad District", state: null })?.precision).toBe("city");
  });

  it("returns null when nothing is known", () => {
    expect(geocoder({ country: "ZZ", zip: null, city: null, state: null })).toBeNull();
  });
});

describe("geoCountry", () => {
  it("routes US territories to their own GeoNames country code", () => {
    expect(geoCountry("US", "Puerto Rico (PR)")).toBe("PR");
    expect(geoCountry("US", "Virgin Islands")).toBe("VI");
    expect(geoCountry("US", "PR")).toBe("PR");
    expect(geoCountry("US", "NJ")).toBe("US");
    expect(geoCountry(null, null)).toBeNull();
  });
});
