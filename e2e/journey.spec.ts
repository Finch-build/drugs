import { expect, test } from "@playwright/test";
import { expectAccessible } from "./helpers";

test("patient journey: guided search → filter → label → facility → globe", async ({ page }) => {
  await page.goto("#/guided-search");
  await page.getByLabel("Drug name", { exact: true }).fill("metformin");
  await page.getByLabel("Company", { exact: true }).fill("granules");
  await page.getByLabel("Company", { exact: true }).press("Enter");

  await expect(page).toHaveURL(/#\/search\?.*name=metformin/);
  const results = page.locator('main a[href*="#/labels/"]');
  await expect(results.first()).toBeVisible({ timeout: 30_000 });
  const before = await results.count();

  const filtersToggle = page.getByRole("button", { name: /^filters/i });
  if (await filtersToggle.isVisible()) await filtersToggle.click();
  const firstDose = page.getByRole("group", { name: /dosage/i }).getByRole("checkbox").first();
  await firstDose.check();
  await expect(page).toHaveURL(/doses=/);
  expect(await results.count()).toBeLessThanOrEqual(before);

  await results.first().click();
  await expect(page.getByRole("heading", { name: /facilities that make this drug/i })).toBeVisible();
  await page.locator('main a[href*="#/facilities/"]').first().click();

  await expect(page).toHaveURL(/#\/facilities\/\d+/);
  await expect(page.getByRole("heading", { name: /fda action history/i })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: /show on globe/i }).first().click();
  await expect(page).toHaveURL(/fei=\d+/);
  await expect(page.locator("main")).toContainText(/view facility|inspection/i);
});

test("NDC lookup finds the matching label", async ({ page }) => {
  await page.goto("#/guided-search");
  await page.getByLabel(/NDC \(National Drug Code\)/).fill("70010-063-05");
  await page.getByLabel(/NDC \(National Drug Code\)/).press("Enter");
  await expect(page).toHaveURL(/ndc=70010-063-05/);
  await expect(page.locator('main a[href*="#/labels/"]').first()).toContainText(/metformin/i, { timeout: 30_000 });
});

test("advanced query syntax narrows results", async ({ page }) => {
  await page.goto("#/search?q=amphetamine%20-dextroamphetamine&advanced=true");
  const results = page.locator('main a[href*="#/labels/"]');
  await expect(results.first()).toBeVisible({ timeout: 30_000 });
  const names = await results.allTextContents();
  expect(names.some((n) => /dextroamphetamine/i.test(n))).toBe(false);
});

test("globe can be paused and browsed without a pointer", async ({ page }) => {
  await page.goto("#/");
  const pause = page.getByRole("button", { name: /pause rotation/i });
  await expect(pause).toBeVisible();
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
  const browser = page.getByRole("searchbox", { name: /browse facilities on the map/i });
  await browser.fill("Granules");
  await page.getByRole("option").first().click();
  await expect(page.locator("main")).toContainText(/granules/i);
});

test("facility search filters by country and keeps state in the URL", async ({ page }) => {
  await page.goto("#/facilities");
  await page.getByLabel("Country", { exact: true }).selectOption({ index: 1 });
  await expect(page).toHaveURL(/country=/);
  await page.reload();
  await expect(page).toHaveURL(/country=/);
});
