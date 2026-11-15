import { expect, test } from "@playwright/test";

test("skip link moves focus to main content", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow is desktop-only");
  await page.goto("#/about");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /skip to main content/i });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("theme toggle switches to ASCII mode and persists across reloads", async ({ page, isMobile }) => {
  await page.goto("#/about");
  if (isMobile) await page.getByRole("button", { name: /menu/i }).click();
  const toggle = page.getByRole("button", { name: /ascii mode/i });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ascii");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ascii");
});

test("primary navigation reaches every section", async ({ page, isMobile }) => {
  await page.goto("#/");
  for (const [label, url] of [
    ["Find My Drug", /guided-search/],
    ["Facilities", /#\/facilities$/],
    ["Insights", /insights/],
    ["About", /about/],
    ["Mission Control", /#\/$/],
  ] as const) {
    if (isMobile) await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("navigation", { name: /primary/i }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
