import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

test.describe('GLB 200 accessible controls', () => {
  test('switches simple mode from the keyboard and restores it after reload', async ({ page }) => {
    await page.goto(MANUAL_URL);

    const toggle = page.locator('#simple-mode-toggle');
    await expect(toggle).toHaveAccessibleName('開啟簡易模式');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName('關閉簡易模式');
    await expect(page.locator('body')).toHaveClass(/simple-mode/);
    await expect(page.locator('.simple-explanation')).toHaveCount(7);
    await expect(page.locator('.simple-explanation').first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('glb-simple-mode'))).toBe('true');

    await page.reload();
    await expect(page.locator('body')).toHaveClass(/simple-mode/);
    await expect(page.getByRole('button', { name: '關閉簡易模式' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('provides names, current state, and visible focus for chapter controls', async ({ page }) => {
    await page.goto(`${MANUAL_URL}#chapter-3`);

    await expect(page.locator('.chapter-nav a[href="#chapter-3"]')).toHaveAttribute('aria-current', 'location');
    await expect(page.getByRole('button', { name: '上一章' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '下一章' })).toBeEnabled();

    const next = page.getByRole('button', { name: '下一章' });
    await next.focus();
    const outline = await next.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('does not clip simple explanations in the 320px vertical document', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await page.goto(MANUAL_URL);
    await page.getByRole('button', { name: '開啟簡易模式' }).click();

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(1);
    await page.locator('#chapter-7 .simple-explanation').scrollIntoViewIfNeeded();
    await expect(page.locator('#chapter-7 .simple-explanation')).toBeInViewport();
  });
});
