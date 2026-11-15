import { describe, expect, it } from "vitest";
import { unflatten, nodeData } from "./devalue";

describe("unflatten", () => {
  it("resolves object references into a tree", () => {
    const flat = [{ a: 1, b: 2 }, "hello", [3, 4], 5, 6];
    expect(unflatten(flat)).toEqual({ a: "hello", b: [5, 6] });
  });

  it("shares memoised references", () => {
    const flat = [{ x: 1, y: 1 }, { v: 2 }, "z"];
    const out = unflatten(flat) as { x: object; y: object };
    expect(out.x).toBe(out.y);
  });

  it("maps -1 to undefined-as-null", () => {
    const flat = [{ a: -1 }];
    expect(unflatten(flat)).toEqual({ a: null });
  });

  it("unwraps Date tuples to their string value", () => {
    const flat = [{ d: 1 }, ["Date", "2020-01-01T00:00:00.000Z"]];
    expect(unflatten(flat)).toEqual({ d: "2020-01-01T00:00:00.000Z" });
  });
});

describe("nodeData", () => {
  it("returns the first data node of a SvelteKit payload", () => {
    const payload = { type: "data", nodes: [null, { type: "data", data: [{ q: 1 }, "metformin"] }] };
    expect(nodeData(payload)).toEqual({ q: "metformin" });
  });

  it("returns null when the payload has no data nodes", () => {
    expect(nodeData({ type: "data", nodes: [null, null] })).toBeNull();
    expect(nodeData({ type: "redirect" })).toBeNull();
  });
});
