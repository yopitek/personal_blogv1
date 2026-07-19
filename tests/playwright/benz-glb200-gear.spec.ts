import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

test.describe('GLB 200 resilient gear practice', () => {
  test('announces D, R, and P actions through native buttons', async ({ page }) => {
    await page.goto(`${MANUAL_URL}#chapter-2`);

    const practice = page.locator('#gear-practice');
    await expect(practice.getByRole('button')).toHaveCount(3);

    const cases = [
      { name: '練習 D 前進檔', result: /D 前進檔.*往下/ },
      { name: '練習 R 倒車檔', result: /R 倒車檔.*往上/ },
      { name: '練習 P 停車檔', result: /P 停車檔.*末端/ },
    ];

    for (const gear of cases) {
      await practice.getByRole('button', { name: gear.name }).click();
      await expect(practice.locator('[role="status"]')).toContainText(gear.result);
      await expect(practice.getByRole('button', { name: gear.name })).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('keeps the official-manual selector reference and instructions without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${MANUAL_URL}#chapter-2`);

    await expect(page.locator('#gear-practice picture img')).toBeVisible();
    await expect(page.locator('#gear-practice')).toContainText('踩住煞車');
    await expect(page.locator('#gear-practice')).toContainText('模擬練習');
    await context.close();
  });

  test('does not depend on WebGL or a third-party script', async ({ page }) => {
    await page.goto(MANUAL_URL);
    const scripts = await page.locator('script[src]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src')));

    expect(scripts).toEqual([]);
    await expect(page.locator('#gear-practice canvas')).toHaveCount(0);
  });
});
