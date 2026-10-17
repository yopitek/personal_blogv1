import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

const calls = [];
globalThis.fetch = async (url) => { calls.push(String(url)); return new Response('{}', { status: 500 }); };

async function hit(path, env) {
  calls.length = 0;
  await worker.fetch(new Request('https://example.test' + path), env, {});
  return calls.filter((u) => u.includes('opendata.cwa.gov.tw'));
}

test('without CWA_API_KEY the worker never calls CWA with a built-in key', async () => {
  for (const p of ['/api/weather', '/api/uv', '/api/earthquake']) {
    assert.deepEqual(await hit(p, {}), [], p);
  }
});

test('with CWA_API_KEY the worker uses it', async () => {
  const urls = await hit('/api/uv', { CWA_API_KEY: 'TESTKEY123' });
  assert.ok(urls.length > 0 && urls.every((u) => u.includes('Authorization=TESTKEY123')));
});

test('source contains no hardcoded CWA key', async () => {
  const { readFileSync } = await import('node:fs');
  assert.doesNotMatch(readFileSync(new URL('./index.js', import.meta.url), 'utf8'), /CWA-[0-9A-F]{8}-/);
});

async function waqiCalls(env) {
  calls.length = 0;
  await worker.fetch(new Request('https://example.test/api/aqi'), env, {});
  return calls.filter((u) => u.includes('api.waqi.info'));
}

test('without WAQI_TOKEN the worker never calls WAQI with a built-in token', async () => {
  assert.deepEqual(await waqiCalls({}), []);
});

test('with WAQI_TOKEN the worker uses it', async () => {
  const urls = await waqiCalls({ WAQI_TOKEN: 'TESTWAQI123' });
  assert.ok(urls.length > 0 && urls.every((u) => u.includes('token=TESTWAQI123')));
});

test('source contains no hardcoded 40-hex token', async () => {
  const { readFileSync } = await import('node:fs');
  assert.doesNotMatch(readFileSync(new URL('./index.js', import.meta.url), 'utf8'), /['"`][0-9a-f]{40}['"`]/);
});
