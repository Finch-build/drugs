const SPECIAL_TYPES = new Set(["Date", "Set", "Map", "BigInt", "RegExp", "URL"]);

export function unflatten(flat: unknown[]): unknown {
  const memo = new Map<number, unknown>();

  const hydrate = (index: number): unknown => {
    if (index < 0) return null;
    if (memo.has(index)) return memo.get(index);
    const value = flat[index];
    let result: unknown;
    if (Array.isArray(value)) {
      result = typeof value[0] === "string" && SPECIAL_TYPES.has(value[0]) ? value[1] ?? null : value.map(hydrate);
    } else if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, number>);
      const obj: Record<string, unknown> = {};
      memo.set(index, obj);
      for (const [key, ref] of entries) obj[key] = hydrate(ref);
      return obj;
    } else {
      result = value;
    }
    memo.set(index, result);
    return result;
  };

  return hydrate(0);
}

interface SvelteKitPayload {
  type?: string;
  nodes?: Array<{ type?: string; data?: unknown[] } | null>;
}

export function nodeData<T = Record<string, unknown>>(payload: SvelteKitPayload): T | null {
  const node = payload.nodes?.find((n) => n?.data);
  return node?.data ? (unflatten(node.data) as T) : null;
}
