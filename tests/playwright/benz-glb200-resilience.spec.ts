import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.GLB_BASE ?? "http://127.0.0.1:1327";
const MANUAL_URL = BASE + "/benz_glb200_manual/";
const IMAGE_DIR = path.resolve("static/benz_glb200_manual/images");

test("shows a descriptive image fallback and retries the selected source", async ({ page }) => {
  await page.route("**/images/ch1-1-dashboard.avif", (route) => route.abort());
  await page.goto(MANUAL_URL + "#chapter-1");

  const media = page.locator("picture[data-asset=\"ch1-1-dashboard\"]").locator("..");
  const fallback = media.locator(".media-fallback");
  await expect(fallback).toBeVisible();
  await expect(fallback).toContainText("圖片暫時無法載入");
  const retry = fallback.getByRole("button", { name: "重新載入圖片" });
  await expect(retry).toBeVisible();

  await page.unroute("**/images/ch1-1-dashboard.avif");
  await retry.click();
  await expect(media.locator("img")).toHaveJSProperty("complete", true);
  await expect(fallback).toBeHidden();
});

test("keeps the guide readable when every image request fails", async ({ page }) => {
  await page.route("**/images/**", (route) => route.abort());
  await page.goto(MANUAL_URL);
  for (const image of await page.locator(".topic-media img").all()) {
    await image.scrollIntoViewIfNeeded();
  }

  await expect(page.locator(".manual-chapter")).toHaveCount(7);
  await expect(page.locator(".topic-media figcaption")).toHaveCount(15);
  await expect(page.locator(".media-fallback:visible")).toHaveCount(15);
});

test("uses no continuous animation and honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(MANUAL_URL);

  const state = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    animated: [...document.querySelectorAll("*")].filter((element) => {
      const style = getComputedStyle(element);
      return style.animationName !== "none" || style.transitionDuration !== "0s";
    }).length,
    canvases: document.querySelectorAll("canvas").length,
  }));

  expect(state.scrollBehavior).toBe("auto");
  expect(state.canvases).toBe(0);
  expect(state.animated).toBe(0);
});

test("keeps every modern instructional image within its transfer budget", () => {
  const avif = fs.readdirSync(IMAGE_DIR).filter((name) => /^ch\d-.+\.avif$/.test(name));
  expect(avif).toHaveLength(15);
  for (const filename of avif) {
    expect(fs.statSync(path.join(IMAGE_DIR, filename)).size, filename).toBeLessThan(130 * 1024);
  }
});
