import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuote, closesFrom, quoteFrom, seriesFrom, TICKERS } from './markets-lib.mjs';

const yahoo = (closes) => ({ chart: { result: [{ meta: { symbol: 'WBC.AX' }, timestamp: closes.map((_, i) => i), indicators: { quote: [{ close: closes }] } }], error: null } });

test('closesFrom drops gaps', () => {
  assert.deepEqual(closesFrom(yahoo([1, null, 2, NaN, 3])), [1, 2, 3]);
});

test('closesFrom handles errors and empty results', () => {
  assert.deepEqual(closesFrom({ chart: { result: null, error: { code: 'Not Found' } } }), []);
  assert.deepEqual(closesFrom(undefined), []);
});

test('quoteFrom computes change vs previous close', () => {
  assert.deepEqual(quoteFrom([100, 101]), { price: 101, change: 1 });
  assert.deepEqual(quoteFrom([200, 199]), { price: 199, change: -0.5 });
  assert.deepEqual(quoteFrom([5]), { price: 5, change: null });
  assert.deepEqual(quoteFrom([]), { price: null, change: null });
});

test('buildQuote marks missing data as null, never guessed', () => {
  const q = buildQuote(TICKERS[0], []);
  assert.equal(q.price, null);
  assert.equal(q.change, null);
});

test('seriesFrom slices ranges', () => {
  const year = Array.from({ length: 250 }, (_, i) => i);
  const s = seriesFrom(year);
  assert.equal(s['1W'].length, 5);
  assert.equal(s['1M'].length, 22);
  assert.equal(s['6M'].length, 126);
  assert.equal(s['1Y'].length, 250);
});
