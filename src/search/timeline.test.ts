import { fixtureFacilityDetail } from "./fixtures";
import { buildTimeline, cleanText, isIssue, isRepackaged, productsFor } from "./timeline";
import { fixtureLabels } from "./fixtures";

describe("cleanText", () => {
  it("strips tags and whitespace", () => expect(cleanText("CGMP/Adulterated<br />\r\n")).toBe("CGMP/Adulterated"));
  it("handles null", () => expect(cleanText(null)).toBe(""));
});

describe("buildTimeline", () => {
  const timeline = buildTimeline(fixtureFacilityDetail);

  it("merges every action newest first", () => {
    expect(timeline.map((e) => `${e.kind}:${e.date}`)).toEqual([
      "inspection:2025-06-13",
      "letter483:2025-06-13",
      "warningLetter:2023-10-16",
      "importAlert:2022-12-07",
      "letter483:2019-06-11",
      "inspection:2018-03-01",
    ]);
  });

  it("gives every entry a unique key", () => {
    expect(new Set(timeline.map((e) => e.key)).size).toBe(timeline.length);
  });

  it("flags issues: anything but a clean NAI inspection", () => {
    expect(timeline.filter(isIssue)).toHaveLength(5);
    expect(isIssue(timeline.at(-1)!)).toBe(false);
  });
});

describe("label helpers", () => {
  it("detects repackagers from the labeler role", () => {
    expect(isRepackaged(fixtureLabels[2])).toBe(true);
    expect(isRepackaged(fixtureLabels[0])).toBe(false);
    expect(isRepackaged({ ...fixtureLabels[0], labelerRole: "relabel" })).toBe(true);
  });

  it("finds products by document and product NDC", () => {
    expect(productsFor(fixtureLabels, "doc-metformin-zydus", "68382-030").map((l) => l.id)).toEqual([2]);
    expect(productsFor(fixtureLabels, "doc-metformin-zydus").map((l) => l.id)).toEqual([1, 2]);
    expect(productsFor(fixtureLabels, "nope", "x")).toEqual([]);
  });
});
