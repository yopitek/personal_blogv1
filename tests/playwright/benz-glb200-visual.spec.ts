import { expect, test } from '@playwright/test';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;

const viewports = [
  { width: 320, height: 780 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1440, height: 900 },
];

const luminance = (rgb: number[]) => {
  const values = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

const contrast = (foreground: number[], background: number[]) => {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
};

const rgb = (value: string) => value.match(/\d+/g)?.slice(0, 3).map(Number) ?? [];

for (const viewport of viewports) {
  test(`keeps the visual hierarchy intact at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto(MANUAL_URL);

    const report = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
      const title = rect('h1');
      const image = rect('.hero-media img');
      const progress = rect('#chapter-progress');
      const previous = rect('#previous-chapter');
      const next = rect('#next-chapter');
      const longestTitle = document.querySelector<HTMLElement>('#chapter-3-title');
      const heading = longestTitle?.closest<HTMLElement>('.chapter-heading');
      const intro = rect('.intro-band');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        title,
        image,
        progress,
        previous,
        next,
        heading: heading?.getBoundingClientRect(),
        longestTitle: longestTitle?.getBoundingClientRect(),
        intro,
      };
    });
    const imageLoaded = await page.locator('.hero-media img').evaluate((image: HTMLImageElement) => (
      image.complete && image.naturalWidth === 663 && image.naturalHeight === 376
    ));
    await page.screenshot({
      path: `/tmp/benz-glb200-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });

    expect(browserErrors).toEqual([]);
    expect(imageLoaded).toBe(true);
    expect(report.overflow).toBeLessThanOrEqual(1);
    expect(report.title?.width).toBeGreaterThan(100);
    expect(report.image?.width).toBeGreaterThan(180);
    expect(report.longestTitle?.width).toBeLessThanOrEqual((report.heading?.width ?? 0) + 1);
    if (viewport.width <= 420) {
      expect(report.intro?.top ?? viewport.height).toBeLessThan(viewport.height);
    }
    if (viewport.width >= 768) {
      expect(report.previous?.right ?? 0).toBeLessThanOrEqual((report.progress?.left ?? 0) + 1);
      expect(report.progress?.right ?? 0).toBeLessThanOrEqual((report.next?.left ?? 0) + 1);
    }
  });
}

test('uses accessible semantic tokens and restrained component geometry', async ({ page }) => {
  await page.goto(MANUAL_URL);

  const css = (await page.locator('style').textContent()) ?? '';
  for (const token of [
    '--color-canvas', '--color-surface', '--color-text', '--color-text-muted',
    '--font-body', '--space-4', '--radius-control', '--focus-ring', '--color-warning',
  ]) {
    expect(css).toContain(token);
  }
  expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\(/);
  expect(css).not.toMatch(/font-size:\s*clamp\([^;]*vw/);

  const styles = await page.evaluate(() => {
    const sample = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const computed = getComputedStyle(element);
      return {
        color: computed.color,
        background: computed.backgroundColor,
        radius: parseFloat(computed.borderTopLeftRadius),
      };
    };
    return {
      body: sample('body'),
      muted: sample('.hero-copy .lede'),
      link: sample('.chapter-nav a'),
      notice: sample('.notice'),
      radii: [...document.querySelectorAll<HTMLElement>('button, .chapter-nav a, .topic-note, .notice, .spec-list')]
        .map((element) => parseFloat(getComputedStyle(element).borderTopLeftRadius)),
    };
  });

  expect(contrast(rgb(styles.body!.color), rgb(styles.body!.background))).toBeGreaterThanOrEqual(4.5);
  expect(contrast(rgb(styles.muted!.color), rgb(styles.body!.background))).toBeGreaterThanOrEqual(4.5);
  expect(styles.radii.every((radius) => radius <= 8)).toBe(true);
});
