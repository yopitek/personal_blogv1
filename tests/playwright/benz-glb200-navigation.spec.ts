import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

test.describe('GLB 200 desktop chapter navigation', () => {
  test.use({ viewport: { width: 1100, height: 800 } });

  test('pages through seven chapters with controls and arrow keys', async ({ page }) => {
    await page.goto(MANUAL_URL);

    const track = page.locator('#chapter-track');
    await expect(track).toBeVisible();
    await expect(page.locator('#chapter-progress')).toHaveText('第 1 章，共 7 章');

    await page.locator('.toc a[href="#chapter-3"]').click();
    await expect(page).toHaveURL(/#chapter-3$/);
    await expect(page.locator('#chapter-progress')).toHaveText('第 3 章，共 7 章');

    const trackWidth = await track.evaluate((element) => element.clientWidth);
    await expect.poll(() => track.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(trackWidth * 1.8);

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#chapter-progress')).toHaveText('第 4 章，共 7 章');

    await page.getByRole('button', { name: '上一章' }).click();
    await expect(page.locator('#chapter-progress')).toHaveText('第 3 章，共 7 章');
  });

  test('keeps wheel input vertical inside a chapter', async ({ page }) => {
    await page.goto(`${MANUAL_URL}#chapter-3`);

    const track = page.locator('#chapter-track');
    const chapter = page.locator('#chapter-3');
    await chapter.hover();
    const before = await track.evaluate((element) => element.scrollLeft);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);

    expect(await chapter.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(Math.abs((await track.evaluate((element) => element.scrollLeft)) - before)).toBeLessThan(5);
  });
});
