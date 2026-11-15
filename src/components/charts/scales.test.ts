import { describeTrend, niceDomainMax, percent, pieLayout, stackLayout, truncateLabel } from "./scales";

describe("niceDomainMax", () => {
  it("rounds the maximum up to a nice number", () => {
    expect(niceDomainMax([3, 47, 12])).toBe(50);
    expect(niceDomainMax([0, 0])).toBe(1);
    expect(niceDomainMax([])).toBe(1);
  });
});

describe("stackLayout", () => {
  it("stacks series in order for each datum", () => {
    const rows = stackLayout(
      [
        { key: "2020", values: { NAI: 2, VAI: 3, OAI: 1 } },
        { key: "2021", values: { NAI: 1, VAI: 0 } },
      ],
      ["NAI", "VAI", "OAI"],
    );
    expect(rows[0].total).toBe(6);
    expect(rows[0].segments).toEqual([
      { series: "NAI", value: 2, start: 0, end: 2 },
      { series: "VAI", value: 3, start: 2, end: 5 },
      { series: "OAI", value: 1, start: 5, end: 6 },
    ]);
    expect(rows[1].segments[2]).toEqual({ series: "OAI", value: 0, start: 1, end: 1 });
  });
});

describe("pieLayout", () => {
  it("splits the circle proportionally and keeps input order", () => {
    const arcs = pieLayout([
      { key: "a", value: 1 },
      { key: "b", value: 3 },
    ]);
    expect(arcs.map((a) => a.key)).toEqual(["a", "b"]);
    expect(arcs[0].startAngle).toBe(0);
    expect(arcs[0].endAngle).toBeCloseTo(Math.PI / 2);
    expect(arcs[1].endAngle).toBeCloseTo(Math.PI * 2);
    expect(arcs[1].share).toBeCloseTo(0.75);
  });

  it("handles an all-zero dataset", () => {
    expect(pieLayout([{ key: "a", value: 0 }])[0].share).toBe(0);
  });
});

describe("percent", () => {
  it("formats a ratio as a percentage", () => {
    expect(percent(1, 3)).toBe("33.3%");
    expect(percent(1, 4, 0)).toBe("25%");
    expect(percent(1, 0)).toBe("—");
  });
});

describe("truncateLabel", () => {
  it("shortens long labels with an ellipsis", () => {
    expect(truncateLabel("Short", 10)).toBe("Short");
    expect(truncateLabel("A very long label indeed", 10)).toBe("A very lo…");
  });

  it("collapses repeated whitespace", () => {
    expect(truncateLabel("two  spaces", 20)).toBe("two spaces");
  });
});

describe("describeTrend", () => {
  it("summarizes the start, end and peak", () => {
    expect(describeTrend([3, 9, 5], ["2019", "2020", "2021"])).toBe("From 3 in 2019 to 5 in 2021, peaking at 9 in 2020.");
  });

  it("handles empty data", () => {
    expect(describeTrend([], [])).toBe("No data.");
  });
});
