import { expect, test } from '@playwright/test';

const BASE = process.env.HEADERS_BASE ?? 'https://zennote.app';

test('serves security headers on the home page', async ({ request }) => {
  const res = await request.get(`${BASE}/`);
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
  // SAMEORIGIN, not DENY: posts embed same-site pages in iframes (e.g. /mahjong/)
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
  expect(h['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
});
