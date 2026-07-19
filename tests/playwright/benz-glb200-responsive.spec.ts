import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

for (const width of [320, 390]) {
  test.describe(`GLB 200 mobile reading at ${width}px`, () => {
    test.use({ viewport: { width, height: 780 } });

    test('keeps all seven chapters in one vertical document without page overflow', async ({ page }) => {
      await page.goto(MANUAL_URL);

      const layout = await page.evaluate(() => {
        const chapters = [...document.querySelectorAll<HTMLElement>('.manual-chapter')];
        const track = document.querySelector<HTMLElement>('#chapter-track');
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          display: track ? getComputedStyle(track).display : null,
          trackHeight: track?.getBoundingClientRect().height ?? 0,
          chapterTops: chapters.map((chapter) => chapter.offsetTop),
          chapterHeights: chapters.map((chapter) => chapter.offsetHeight),
        };
      });

      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.display).toBe('block');
      expect(layout.trackHeight).toBeGreaterThan(4000);
      expect(layout.chapterTops).toHaveLength(7);
      expect(layout.chapterHeights.every((height) => height > 250)).toBe(true);
      expect(layout.chapterTops.every((top, index, tops) => index === 0 || top > tops[index - 1])).toBe(true);

      await page.locator('#chapter-7').scrollIntoViewIfNeeded();
      await expect(page.locator('#chapter-7')).toBeInViewport();
    });

    test('uses the sticky chapter menu and restores a chapter hash after reload', async ({ page }) => {
      await page.goto(`${MANUAL_URL}#chapter-5`);
      await page.reload();

      const header = page.locator('.site-header');
      await expect(header).toHaveCSS('position', 'sticky');
      await expect(page.locator('.chapter-nav a[href="#chapter-5"]')).toHaveAttribute('aria-current', 'location');
      await expect(page.locator('#chapter-5')).toBeInViewport();

      await page.locator('.chapter-nav a[href="#chapter-6"]').click();
      await expect(page).toHaveURL(/#chapter-6$/);
      await expect(page.locator('.chapter-nav a[href="#chapter-6"]')).toHaveAttribute('aria-current', 'location');
      await expect(page.locator('#chapter-6')).toBeInViewport();
    });
  });
}

test('declares dynamic viewport and safe-area protection', async ({ page }) => {
  await page.goto(MANUAL_URL);
  const css = await page.locator('style').textContent();

  expect(css).toContain('100dvh');
  expect(css).toContain('env(safe-area-inset-top)');
  expect(css).toContain('env(safe-area-inset-right)');
  expect(css).toContain('env(safe-area-inset-bottom)');
  expect(css).toContain('env(safe-area-inset-left)');
});
