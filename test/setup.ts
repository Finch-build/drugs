import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { afterEach, expect, vi } from "vitest";

expect.extend(axeMatchers);

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, writable: true });

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in window)) Object.defineProperty(window, "ResizeObserver", { writable: true, value: ResizeObserverStub });

afterEach(() => {
  vi.unstubAllGlobals();
});
