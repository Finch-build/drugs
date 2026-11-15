import { FACILITIES, INSIGHTS, META } from "./fixtures";
import { buildCallouts, countryMetrics, flaggedShare, recentFlagged } from "./metrics";

describe("countryMetrics", () => {
  it("derives rates for a country", () => {
    const m = countryMetrics(INSIGHTS.byCountry[0]);
    expect(m.oaiRate).toBeCloseTo(0.1);
    expect(m.warningLettersPerFacility).toBeCloseTo(0.2);
    expect(m.flaggedShare).toBeCloseTo(0.16);
    expect(m.facilities).toBe(50);
  });

  it("avoids dividing by zero", () => {
    const m = countryMetrics({ ...INSIGHTS.byCountry[0], inspections: 0, facilities: 0 });
    expect(m.oaiRate).toBe(0);
    expect(m.warningLettersPerFacility).toBe(0);
    expect(m.flaggedShare).toBe(0);
  });
});

describe("recentFlagged", () => {
  it("keeps only flagged facilities, newest first", () => {
    expect(recentFlagged(FACILITIES).map((f) => f.fei)).toEqual(["3", "1", "4"]);
    expect(recentFlagged(FACILITIES, 1)).toHaveLength(1);
  });
});

describe("flaggedShare", () => {
  it("computes the share of facilities whose latest action was serious", () => {
    expect(flaggedShare(INSIGHTS.statusCounts)).toBeCloseTo(0.1);
  });
});

describe("buildCallouts", () => {
  it("produces readable data-driven sentences", () => {
    const callouts = buildCallouts(INSIGHTS, META);
    const text = callouts.map((c) => `${c.value} ${c.text}`).join("\n");
    expect(text).toContain("50%");
    expect(text).toMatch(/India/);
    expect(text).toMatch(/2024/);
    expect(text).toMatch(/21 CFR 211\.192/);
    expect(callouts.length).toBeGreaterThanOrEqual(4);
  });

  it("handles empty insights", () => {
    expect(buildCallouts({ ...INSIGHTS, byCountry: [], warningLettersByYear: [], topCitations: [] }, META).length).toBeGreaterThanOrEqual(1);
  });
});
