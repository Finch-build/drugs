import { expect, test } from "@playwright/test";
import { expectAccessible, THEMES, useTheme } from "./helpers";

for (const theme of THEMES) {
  test(`${theme} theme: tapping a dot opens a stats card on the globe`, async ({ page, isMobile, hasTouch }) => {
    await useTheme(page, theme);
    await page.goto("#/");
    const canvas = page.locator(".globe__canvas").first();
    await canvas.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /pause rotation/i }).first().click();

    // Dots are canvas pixels, so scan outward from the centre until one is hit.
    const box = (await canvas.boundingBox())!;
    const card = page.locator(".globe-card");
    search: for (let dy = -120; dy <= 120; dy += 12) {
      for (let dx = -120; dx <= 120; dx += 12) {
        const x = box.x + box.width / 2 + dx;
        const y = box.y + box.height / 2 + dy;
        if (hasTouch) await page.touchscreen.tap(x, y);
        else await page.mouse.click(x, y);
        if (await card.count()) break search;
      }
    }

    await expect(card).toBeVisible();
    await expect(card.getByText("Inspections")).toBeVisible();
    await expect(card.getByRole("link", { name: /facility record/i })).toBeInViewport();
    const inside = await card.evaluate((el) => {
      const c = el.getBoundingClientRect();
      const v = el.parentElement!.getBoundingClientRect();
      return c.top >= v.top && c.bottom <= v.bottom && c.left >= v.left && c.right <= v.right;
    });
    expect(inside, "card sits on the globe").toBe(true);
    if (isMobile) await expectAccessible(page);

    await card.getByRole("button", { name: /close details/i }).click();
    await expect(card).toHaveCount(0);
  });
}
