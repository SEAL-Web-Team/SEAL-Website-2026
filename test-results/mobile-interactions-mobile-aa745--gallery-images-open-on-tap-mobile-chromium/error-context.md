# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-interactions.spec.ts >> mobile interactions >> gallery images open on tap
- Location: e2e/mobile-interactions.spec.ts:32:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.lightbox-frame')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.lightbox-frame')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "SEAL icon" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "SEAL icon" [ref=e6]
      - group [ref=e7]:
        - generic "Toggle menu" [ref=e8] [cursor=pointer]
  - main [ref=e12]:
    - generic [ref=e14]:
      - link "← Back to Gallery" [ref=e16] [cursor=pointer]:
        - /url: /gallery
      - generic [ref=e17]:
        - heading "Spring17 Group Photo" [level=1] [ref=e18]
        - paragraph [ref=e19]: 19 photos
      - generic [ref=e20]:
        - button "Open image 1" [active] [ref=e21] [cursor=pointer]:
          - img "IMG_7009" [ref=e23]
        - button "Open image 2" [ref=e24] [cursor=pointer]:
          - img "IMG_7016" [ref=e26]
        - button "Open image 3" [ref=e27] [cursor=pointer]:
          - img "IMG_7029" [ref=e29]
        - button "Open image 4" [ref=e30] [cursor=pointer]:
          - img "IMG_7031" [ref=e32]
        - button "Open image 5" [ref=e33] [cursor=pointer]:
          - img "IMG_7036" [ref=e35]
        - button "Open image 6" [ref=e36] [cursor=pointer]:
          - img "IMG_7037" [ref=e38]
        - button "Open image 7" [ref=e39] [cursor=pointer]:
          - img "IMG_7041" [ref=e41]
        - button "Open image 8" [ref=e42] [cursor=pointer]:
          - img "IMG_7044" [ref=e44]
        - button "Open image 9" [ref=e45] [cursor=pointer]:
          - img "IMG_7049" [ref=e47]
        - button "Open image 10" [ref=e48] [cursor=pointer]:
          - img "IMG_7053" [ref=e50]
        - button "Open image 11" [ref=e51] [cursor=pointer]:
          - img "IMG_7057" [ref=e53]
        - button "Open image 12" [ref=e54] [cursor=pointer]:
          - img "IMG_7062" [ref=e56]
        - button "Open image 13" [ref=e57] [cursor=pointer]:
          - img "IMG_7063" [ref=e59]
        - button "Open image 14" [ref=e60] [cursor=pointer]:
          - img "IMG_7073" [ref=e62]
        - button "Open image 15" [ref=e63] [cursor=pointer]:
          - img "IMG_7076" [ref=e65]
        - button "Open image 16" [ref=e66] [cursor=pointer]:
          - img "IMG_7082" [ref=e68]
        - button "Open image 17" [ref=e69] [cursor=pointer]:
          - img "IMG_7086" [ref=e71]
        - button "Open image 18" [ref=e72] [cursor=pointer]:
          - img "IMG_7091" [ref=e74]
        - button "Open image 19" [ref=e75] [cursor=pointer]:
          - img "SEALteam" [ref=e77]
  - contentinfo [ref=e78]:
    - paragraph [ref=e79]: © 2026 SEAL. All Rights Reserved.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.describe("mobile interactions", () => {
  4  |   test("news cards open on tap", async ({ page }) => {
  5  |     await page.goto("/news");
  6  | 
  7  |     const firstCard = page.locator("a.surface-card").first();
  8  |     await expect(firstCard).toBeVisible();
  9  |     await firstCard.tap();
  10 | 
  11 |     await expect(page).toHaveURL(/\/news\/\d+$/);
  12 |     await expect(page.getByRole("link", { name: /Back to News/i })).toBeVisible();
  13 |   });
  14 | 
  15 |   test("publication sections collapse on tap", async ({ page }) => {
  16 |     await page.goto("/publications");
  17 | 
  18 |     const journalSection = page.locator("section").first();
  19 |     const journalToggle = journalSection.getByRole("button", { name: /Journal Publications/i });
  20 |     const knownJournalTitle = page.getByText(/Analytical Model For Electrohydrodynamic Thrust/i).first();
  21 | 
  22 |     await expect(journalToggle).toBeVisible();
  23 |     await expect(knownJournalTitle).toBeVisible();
  24 | 
  25 |     await journalToggle.tap();
  26 |     await expect(knownJournalTitle).toBeHidden();
  27 | 
  28 |     await journalToggle.tap();
  29 |     await expect(knownJournalTitle).toBeVisible();
  30 |   });
  31 | 
  32 |   test("gallery images open on tap", async ({ page }) => {
  33 |     await page.goto("/gallery/spring17-group-photo");
  34 | 
  35 |     const firstTile = page.locator("button.gallery-tile").first();
  36 |     await expect(firstTile).toBeVisible();
  37 |     await firstTile.tap();
  38 | 
> 39 |     await expect(page.locator(".lightbox-frame")).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  40 |   });
  41 | });
  42 | 
```