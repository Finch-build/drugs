import { pageNumbers, paginate } from "./pagination";

describe("paginate", () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1);

  it("slices a page and reports range", () => {
    const page = paginate(items, 2, 24);
    expect(page.items[0]).toBe(25);
    expect(page.items).toHaveLength(24);
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 50, start: 25, end: 48 });
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(items, 99, 24).page).toBe(3);
    expect(paginate(items, -1, 24).page).toBe(1);
    expect(paginate(items, Number.NaN, 24).page).toBe(1);
  });

  it("handles empty lists", () => {
    expect(paginate([], 1, 24)).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0, start: 0, end: 0 });
  });
});

describe("pageNumbers", () => {
  it("lists every page when there are few", () => expect(pageNumbers(2, 4)).toEqual([1, 2, 3, 4]));
  it("collapses distant pages into gaps", () => expect(pageNumbers(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]));
  it("keeps the edges near the start", () => expect(pageNumbers(1, 20)).toEqual([1, 2, "gap", 20]));
});
