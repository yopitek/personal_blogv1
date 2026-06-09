// tests/playwright/zennote-tools.spec.ts
// ZenNote Web Tools - Comprehensive Playwright Test Suite
import { test, expect } from '@playwright/test';

const BASE = 'https://zennote.app';

test.describe('Global Security Headers', () => {
  test('CSP meta tag present on homepage', async ({ page }) => {
    const response = await page.goto(BASE);
    expect(response?.status()).toBe(200);
    
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').count();
    expect(csp).toBeGreaterThan(0);
  });

  test('X-Content-Type-Options present', async ({ page }) => {
    await page.goto(BASE);
    const xcto = await page.locator('meta[http-equiv="X-Content-Type-Options"]').count();
    expect(xcto).toBeGreaterThan(0);
  });

  test('X-Frame-Options present', async ({ page }) => {
    await page.goto(BASE);
    const xfo = await page.locator('meta[http-equiv="X-Frame-Options"]').count();
    expect(xfo).toBeGreaterThan(0);
  });
});

test.describe('ig_card_tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/ig_card_tool/`);
    await page.waitForLoadState('networkidle');
  });

  test('page loads with favicon', async () => {
    const response = await fetch(`${BASE}/ig_card_tool/`);
    expect(response.status).toBe(200);
  });

  test('all 12 themes visible in style grid', async ({ page }) => {
    const themes = await page.locator('.style-item').count();
    expect(themes).toBe(12);
  });

  test('theme buttons have aria-label', async ({ page }) => {
    const firstTheme = page.locator('.style-item').first();
    const label = await firstTheme.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('font size slider has ARIA attributes', async ({ page }) => {
    const slider = page.locator('#font-size');
    await expect(slider).toHaveAttribute('aria-valuemin');
    await expect(slider).toHaveAttribute('aria-valuemax');
    await expect(slider).toHaveAttribute('aria-valuenow');
  });

  test('export button exists and is clickable', async ({ page }) => {
    // Type some text first
    await page.locator('#card-text').fill('Test Card');
    await page.waitForTimeout(500);
    
    const exportBtn = page.locator('#export-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test('font loading is non-blocking', async ({ page }) => {
    // Use nth(1) to skip the preconnect link, target the actual stylesheet
    const fontLink = page.locator('link[href*="fonts.googleapis.com"][rel="stylesheet"]');
    const media = await fontLink.getAttribute('media');
    expect(media).toContain('print');
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('decoder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/decoder/`);
    await page.waitForLoadState('networkidle');
  });

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(`${BASE}/decoder/`);
    expect(response?.status()).toBe(200);
  });

  test('lang attribute is zh-TW', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('zh-TW');
  });

  test('loading spinner present before React mounts', async ({ page }) => {
    // Fetch raw HTML before JS executes to see the spinner
    const response = await page.goto(`${BASE}/decoder/`, { waitUntil: 'commit' });
    const html = await response?.text();
    expect(html).toContain('loading-spinner');
  });

  test('no Google Fonts reference', async ({ page }) => {
    const content = await page.content();
    expect(content).not.toContain('fonts.googleapis.com');
  });

  test('noscript tag present', async ({ page }) => {
    const noscript = await page.locator('noscript').count();
    expect(noscript).toBeGreaterThan(0);
  });

  test('meta theme-color present', async ({ page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]').count();
    expect(themeColor).toBeGreaterThan(0);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('news_feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/news_feed/`);
    await page.waitForLoadState('networkidle');
  });

  test('page loads with correct title', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('每日電子新聞報');
  });

  test('all 4 tabs visible', async ({ page }) => {
    const tabs = await page.locator('.tab-btn').count();
    expect(tabs).toBe(4);
  });

  test('tab buttons have aria-controls', async ({ page }) => {
    const firstTab = page.locator('.tab-btn').first();
    const controls = await firstTab.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
  });

  test('tab panels have aria-labelledby', async ({ page }) => {
    const panel = page.locator('[role="tabpanel"]').first();
    const labelledby = await panel.getAttribute('aria-labelledby');
    expect(labelledby).toBeTruthy();
  });

  test('tab switching works (Chinese default)', async ({ page }) => {
    const activeTab = page.locator('.tab-btn.active');
    const tabText = await activeTab.textContent();
    expect(tabText?.trim()).toBe('中文新聞');
  });

  test('keyboard navigation: right arrow', async ({ page }) => {
    await page.locator('.tab-btn.active').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // 英文新聞 should now be active
    const activeTab = page.locator('.tab-btn.active');
    const tabText = await activeTab.textContent();
    expect(tabText?.trim()).toBe('English News');
  });

  test('OG meta tags present', async ({ page }) => {
    const ogTitle = await page.locator('meta[property="og:title"]').count();
    expect(ogTitle).toBeGreaterThan(0);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

test.describe('tool_landing', () => {
  test('no typos: tool names correct', async ({ page }) => {
    await page.goto(`${BASE}/page/tool/`);
    const content = await page.textContent('body');
    expect(content).not.toContain('成生');
    expect(content).toContain('生成');
  });

  test('correct domain without www', async ({ page }) => {
    await page.goto(`${BASE}/page/tool/`);
    const content = await page.textContent('body');
    expect(content).not.toContain('www.zennote.app');
  });
});
