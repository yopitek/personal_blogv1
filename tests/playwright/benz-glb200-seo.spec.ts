import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;
const CANONICAL = 'https://zennote.app/benz_glb200_manual';

test('publishes canonical social and article metadata for the new URL', async ({ page }) => {
  await page.goto(MANUAL_URL);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', CANONICAL);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[property="article:modified_time"]')).toHaveAttribute('content', /2026-07-19/);
  await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', 'ZenNote 編輯');
  expect(await page.locator('head').innerHTML()).not.toContain('benz_b200_manual');
});

test('keeps TechArticle and generated FAQPage data aligned with visible content', async ({ page }) => {
  await page.goto(MANUAL_URL);
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => (
    scripts.map((script) => JSON.parse(script.textContent || '{}'))
  ));
  const article = schemas.find((schema) => schema['@type'] === 'TechArticle');
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
  const visibleFaq = await page.locator('.faq details').evaluateAll((items) => items.map((item) => ({
    name: item.querySelector('summary')?.textContent?.trim(),
    text: item.querySelector('p')?.textContent?.trim(),
  })));

  expect(article.url).toBe(CANONICAL);
  expect(article.dateModified).toMatch(/^2026-07-19T/);
  expect(article.author.name).toBe('ZenNote 編輯');
  expect(faq.mainEntity).toHaveLength(visibleFaq.length);
  expect(faq.mainEntity.map((item) => ({ name: item.name, text: item.acceptedAnswer.text }))).toEqual(visibleFaq);
  expect(JSON.stringify(schemas)).not.toContain('HowTo');
});
