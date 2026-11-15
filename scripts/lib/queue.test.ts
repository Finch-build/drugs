import { describe, expect, it } from "vitest";
import { createLimiter, splitList, ingredientQueries, searchPages } from "./queue";

describe("createLimiter", () => {
  it("never runs more than the limit at once", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let peak = 0;
    const task = () =>
      limit(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 5));
        active--;
      });
    await Promise.all(Array.from({ length: 8 }, task));
    expect(peak).toBe(2);
  });
});

describe("splitList", () => {
  it("splits whitespace and comma separated identifiers", () => {
    expect(splitList("3004097901 3005 , 3006")).toEqual(["3004097901", "3005", "3006"]);
    expect(splitList(null)).toEqual([]);
  });
});

describe("ingredientQueries", () => {
  it("derives distinct lower-case ingredient names", () => {
    expect(ingredientQueries("METFORMIN HYDROCHLORIDE, SAXAGLIPTIN")).toEqual(["metformin hydrochloride", "saxagliptin"]);
    expect(ingredientQueries(null)).toEqual([]);
  });
});

describe("searchPages", () => {
  it("lists remaining page numbers for a capped result total", () => {
    expect(searchPages(30, 12)).toEqual([1, 2]);
    expect(searchPages(12, 12)).toEqual([]);
    expect(searchPages(5000, 12).length).toBe(83);
  });
});
