export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
}

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const current = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), pageCount) : 1;
  const offset = (current - 1) * perPage;
  const slice = items.slice(offset, offset + perPage);
  return {
    items: slice,
    page: current,
    pageCount,
    total: items.length,
    start: slice.length ? offset + 1 : 0,
    end: offset + slice.length,
  };
}

export function pageNumbers(current: number, count: number, around = 1): Array<number | "gap"> {
  const pages: Array<number | "gap"> = [];
  for (let n = 1; n <= count; n++) {
    const visible = n === 1 || n === count || Math.abs(n - current) <= around;
    if (visible) pages.push(n);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }
  return pages;
}
