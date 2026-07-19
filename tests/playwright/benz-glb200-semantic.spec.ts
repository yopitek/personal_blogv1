import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

test.describe('GLB 200 semantic manual', () => {
  test.use({ javaScriptEnabled: false });

  test('renders the complete guide without JavaScript', async ({ page }) => {
    const response = await page.goto(MANUAL_URL);

    expect(response?.status()).toBe(200);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('main article')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('section.manual-chapter')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: /第 1 章.*駕駛艙與方向盤/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /第 7 章.*保養與緊急狀況/ })).toBeVisible();
    await expect(page.getByText('胎壓監測警示重設 TPMS')).toBeVisible();
  });

  test('provides stable chapter anchors and a skip link', async ({ page }) => {
    await page.goto(MANUAL_URL);

    await expect(page.locator('a.skip-link[href="#main-content"]')).toHaveCount(1);
    for (let chapter = 1; chapter <= 7; chapter += 1) {
      await expect(page.locator(`#chapter-${chapter}`)).toHaveCount(1);
      await expect(page.locator(`a[href="#chapter-${chapter}"]`).first()).toHaveCount(1);
    }
  });

  test('has no duplicate IDs or broken label references', async ({ page }) => {
    await page.goto(MANUAL_URL);

    const audit = await page.evaluate(() => {
      const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map((node) => node.id);
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      const missingLabels = [...document.querySelectorAll<HTMLElement>('[aria-labelledby]')]
        .flatMap((node) => (node.getAttribute('aria-labelledby') ?? '').split(/\s+/))
        .filter((id) => id && !document.getElementById(id));
      const imagesWithoutAlt = [...document.images].filter((image) => !image.hasAttribute('alt')).length;

      return { duplicateIds, missingLabels, imagesWithoutAlt };
    });

    expect(audit).toEqual({ duplicateIds: [], missingLabels: [], imagesWithoutAlt: 0 });
  });
});
