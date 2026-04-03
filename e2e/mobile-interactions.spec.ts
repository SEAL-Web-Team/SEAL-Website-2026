import { expect, test } from "@playwright/test";

test.describe("mobile interactions", () => {
  test("news cards open on tap", async ({ page }) => {
    await page.goto("/news");

    const firstCard = page.locator("a.surface-card").first();
    await expect(firstCard).toBeVisible();
    await firstCard.tap();

    await expect(page).toHaveURL(/\/news\/\d+$/);
    await expect(page.getByRole("link", { name: /Back to News/i })).toBeVisible();
  });

  test("publication sections collapse on tap", async ({ page }) => {
    await page.goto("/publications");

    const journalSection = page.locator("section").first();
    const journalToggle = journalSection.getByRole("button", { name: /Journal Publications/i });
    const knownJournalTitle = page.getByText(/Analytical Model For Electrohydrodynamic Thrust/i).first();

    await expect(journalToggle).toBeVisible();
    await expect(knownJournalTitle).toBeVisible();

    await journalToggle.tap();
    await expect(knownJournalTitle).toBeHidden();

    await journalToggle.tap();
    await expect(knownJournalTitle).toBeVisible();
  });

  test("gallery images open on tap", async ({ page }) => {
    await page.goto("/gallery/spring17-group-photo");

    const firstTile = page.locator("button.gallery-tile").first();
    await expect(firstTile).toBeVisible();
    await firstTile.tap();

    await expect(page.locator(".lightbox-frame")).toBeVisible();
  });
});
