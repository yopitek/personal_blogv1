import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

test.describe('GLB 200 FAQ disclosures', () => {
  test.use({ viewport: { width: 320, height: 780 } });

  test('opens and closes with Enter and Space without moving focus', async ({ page }) => {
    await page.goto(`${MANUAL_URL}#chapter-1`);

    const details = page.locator('#chapter-1 .faq details').first();
    const summary = details.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');

    await expect(details).toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await expect(details.locator('p')).toBeVisible();

    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(1);
  });

  test('keeps all visible FAQ content available without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 780 } });
    const page = await context.newPage();
    await page.goto(MANUAL_URL);

    await expect(page.locator('.faq details')).toHaveCount(14);
    await page.locator('.faq details').last().locator('summary').click();
    await expect(page.locator('.faq details').last().locator('p')).toBeVisible();
    await context.close();
  });

  test('uses the visible details elements as the single FAQ content source', async ({ page }) => {
    await page.goto(MANUAL_URL);
    const faq = await page.locator('.faq details').evaluateAll((items) => items.map((item) => ({
      question: item.querySelector('summary')?.textContent?.trim(),
      answer: item.querySelector('p')?.textContent?.trim(),
    })));

    expect(faq).toHaveLength(14);
    expect(faq.every(({ question, answer }) => Boolean(question && answer))).toBe(true);
    expect(new Set(faq.map(({ question }) => question)).size).toBe(14);
  });
});
