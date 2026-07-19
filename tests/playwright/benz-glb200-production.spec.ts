import { expect, test } from '@playwright/test';

const BASE = (process.env.GLB_PRODUCTION_BASE ?? '').replace(/\/$/, '');
const TARGET_PATH = '/benz_glb200_manual';
const TARGET_URL = `${BASE}${TARGET_PATH}`;
const LEGACY_PATHS = ['/benz_b200_manual.html', '/benz_b200_manual'];

test.describe('GLB 200 production release gate', () => {
  test.skip(!BASE, 'Set GLB_PRODUCTION_BASE to run checks against the deployed site');

  test('serves the canonical page and every rendered image without browser errors', async ({ page, request }) => {
    const browserErrors: string[] = [];
    const failedResponses: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', TARGET_URL);
    await expect(page.locator('.topic-media')).toHaveCount(15);

    const images = page.locator('img');
    await expect(images).toHaveCount(16);
    for (const image of await images.all()) await image.scrollIntoViewIfNeeded();

    const imageUrls = await images.evaluateAll((elements: HTMLImageElement[]) =>
      elements.map((image) => image.currentSrc || image.src),
    );
    for (const imageUrl of imageUrls) {
      const imageResponse = await request.get(imageUrl);
      expect(imageResponse.status(), imageUrl).toBe(200);
    }

    expect(failedResponses).toEqual([]);
    expect(browserErrors).toEqual([]);
  });

  test('redirects each legacy URL directly and permanently to the canonical URL', async ({ request }) => {
    for (const legacyPath of LEGACY_PATHS) {
      const response = await request.get(`${BASE}${legacyPath}`, { maxRedirects: 0 });
      expect([301, 308], legacyPath).toContain(response.status());
      expect(new URL(response.headers().location, BASE).href, legacyPath).toBe(TARGET_URL);
    }
  });

  test('publishes only the canonical manual URL in the sitemap', async ({ request }) => {
    const response = await request.get(`${BASE}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const sitemap = await response.text();

    expect(sitemap).toContain(`<loc>${TARGET_URL}</loc>`);
    expect(sitemap).not.toContain('/benz_b200_manual');
  });
});
