import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

// Regression tests for T17 fixes: YouBike field names (B3) and education
// expired-holiday handling (B5). No network: fetch is stubbed.

function blobStation(name, opts) {
  // opts: { rent, total, sbi, tot } — new schema and/or legacy schema fields
  const s = { sna: `YouBike2.0_${name}`, sarea: '信義區' };
  if (opts.rent !== undefined) s.available_rent_bikes = String(opts.rent);
  if (opts.total !== undefined) s.Quantity = String(opts.total);
  if (opts.sbi !== undefined) s.sbi = String(opts.sbi);
  if (opts.tot !== undefined) s.tot = String(opts.tot);
  return s;
}

async function hitYoubike(stations) {
  globalThis.fetch = async () => new Response(JSON.stringify(stations));
  const res = await worker.fetch(new Request('https://example.test/api/youbike'), {}, {});
  return await res.json();
}

test('youbike parses the CURRENT upstream schema (available_rent_bikes/Quantity)', async () => {
  const rows = await hitYoubike([blobStation('大安森林公園站', { rent: 8, total: 15 })]);
  const st = rows.find((r) => r.station.includes('大安森林公園站'));
  assert.ok(st, 'station present');
  assert.equal(st.bikes, 8);
  assert.equal(st.total, 15);
});

test('youbike still parses the LEGACY schema (sbi/tot) as fallback', async () => {
  const rows = await hitYoubike([blobStation('大安森林公園站', { sbi: 5, tot: 20 })]);
  const st = rows.find((r) => r.station.includes('大安森林公園站'));
  assert.ok(st, 'station present');
  assert.equal(st.bikes, 5);
  assert.equal(st.total, 20);
});

test('education never returns an expired countdown holiday', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  const res = await worker.fetch(new Request('https://example.test/api/education'), {}, {});
  const data = await res.json();
  const nh = data.next_holiday;
  // While the target date below is in the past the API must return null,
  // never a stale holiday with days clamped to 0. If the owner installs a
  // future-dated holiday table, days must be > 0.
  assert.ok(nh === null || nh.days > 0, `expired holiday returned: ${JSON.stringify(nh)}`);
});
