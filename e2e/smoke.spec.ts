import { expect, test } from "@playwright/test";
import { collectConsoleErrors, expectAccessible, expectNoHorizontalScroll, THEMES, useTheme } from "./helpers";

const ROUTES = [
  { path: "#/", name: "mission control" },
  { path: "#/insights", name: "insights" },
  { path: "#/guided-search", name: "guided search" },
  { path: "#/search?name=metformin", name: "search results" },
  { path: "#/search?q=%22teva%22%20OR%20apotex&advanced=true", name: "advanced search" },
  { path: "#/facilities", name: "facility search" },
  { path: "#/facilities/3004097901", name: "facility detail" },
  { path: "#/about", name: "about" },
  { path: "#/no-such-page", name: "not found" },
];

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    for (const route of ROUTES) {
      test(`${route.name} renders accessibly`, async ({ page }) => {
        const errors = await collectConsoleErrors(page);
        await useTheme(page, theme);
        await page.goto(route.path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator('[role="status"]:has-text("Loading")')).toHaveCount(0, { timeout: 30_000 });
        await expectNoHorizontalScroll(page);
        await expectAccessible(page);
        expect(errors).toEqual([]);
      });
    }
  });
}

test("label detail page is reachable from search and accessible", async ({ page }) => {
  await page.goto("#/search?name=metformin");
  const firstResult = page.locator('main a[href*="#/labels/"]').first();
  await expect(firstResult).toBeVisible({ timeout: 30_000 });
  await firstResult.click();
  await expect(page).toHaveURL(/#\/labels\/[^/]+\/[^/]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectAccessible(page);
});
