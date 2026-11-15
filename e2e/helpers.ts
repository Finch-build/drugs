import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const THEMES = ["standard", "ascii"] as const;
export type Theme = (typeof THEMES)[number];

export async function useTheme(page: Page, theme: Theme) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("rx-theme", value);
    } catch {
      return;
    }
  }, theme);
}

export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(message.text())) errors.push(message.text());
  });
  return errors;
}
