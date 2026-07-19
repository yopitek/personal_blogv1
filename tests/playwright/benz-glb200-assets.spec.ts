import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.GLB_BASE ?? 'http://127.0.0.1:1327';
const MANUAL_URL = `${BASE}/benz_glb200_manual/`;
const IMAGE_DIR = path.resolve('static/benz_glb200_manual/images');
const manifest = JSON.parse(fs.readFileSync(path.join(IMAGE_DIR, 'manifest.json'), 'utf8'));

test('maps every rendered image to an approved manifest record and local file', async ({ page }) => {
  const failedResponses: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(MANUAL_URL);
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
  }

  const rendered = await page.locator('img').evaluateAll((images: HTMLImageElement[]) => images.map((image) => ({
    filename: new URL(image.currentSrc || image.src, document.baseURI).pathname.split('/').pop(),
    alt: image.alt,
    width: image.width,
    height: image.height,
    naturalWidth: image.naturalWidth || Number(image.getAttribute("width")),
    naturalHeight: image.naturalHeight || Number(image.getAttribute("height")),
  })));

  for (const image of rendered) {
    const asset = manifest.assets.find((candidate: { filename: string }) => candidate.filename === image.filename);
    expect(asset, `${image.filename} missing from manifest`).toBeTruthy();
    expect(asset.approval.status).toBe('approved');
    expect(asset.usedInHtml).toBe(true);
    expect(asset.alt).toBe(image.alt);
    expect(asset.width).toBe(image.naturalWidth);
    expect(asset.height).toBe(image.naturalHeight);
    expect(fs.existsSync(path.join(IMAGE_DIR, asset.filename))).toBe(true);
  }
  expect(failedResponses).toEqual([]);
});

test('keeps unapproved planned assets out of the document', async ({ page }) => {
  await page.goto(MANUAL_URL);
  const html = await page.locator('html').innerHTML();
  const unapproved = manifest.assets.filter((asset: { approval: { status: string } }) => asset.approval.status !== 'approved');

  expect(unapproved.length).toBeGreaterThan(0);
  for (const asset of unapproved) {
    expect(html).not.toContain(asset.filename);
    expect(asset.usedInHtml).toBe(false);
  }
  expect(html).not.toMatch(/圖片待置換|image[_ -]?placeholder/i);
});

test('serves the optimized hero below the transfer budget with a PNG fallback', async ({ page }) => {
  await page.goto(MANUAL_URL);
  const image = page.locator('.hero-media img');
  await expect(image).toHaveAttribute('src', 'images/glb_200.png');
  expect(await image.evaluate((element: HTMLImageElement) => element.currentSrc.endsWith('/images/glb_200.webp'))).toBe(true);
  expect(fs.statSync(path.join(IMAGE_DIR, 'glb_200.webp')).size).toBeLessThan(180 * 1024);
});
