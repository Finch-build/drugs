export const SEARCH_CAP = 1000;

export function createLimiter(max: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  const next = () => {
    if (active >= max) return;
    const run = waiting.shift();
    if (run) run();
  };
  return <T>(task: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      waiting.push(() => {
        active++;
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
}

export function splitList(value: string | null | undefined): string[] {
  return (value ?? "").split(/[\s,]+/).filter(Boolean);
}

export function ingredientQueries(ingredients: string | null | undefined): string[] {
  const names = (ingredients ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [...new Set(names)];
}

export function searchPages(total: number, pageSize: number): number[] {
  const pages = Math.ceil(Math.min(total, SEARCH_CAP) / pageSize);
  return Array.from({ length: Math.max(pages - 1, 0) }, (_, i) => i + 1);
}
