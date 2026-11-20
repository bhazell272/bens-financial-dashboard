// Pure helpers for fetch-markets.mjs, kept separate so they can be unit tested
// without the network.

export const TICKERS = [
  { id: 'WBC.AX', name: 'Westpac', sub: 'WBC', group: 'banks', decimals: 2 },
  { id: 'CBA.AX', name: 'CBA', sub: 'CBA', group: 'banks', decimals: 2 },
  { id: 'NAB.AX', name: 'NAB', sub: 'NAB', group: 'banks', decimals: 2 },
  { id: 'ANZ.AX', name: 'ANZ', sub: 'ANZ', group: 'banks', decimals: 2 },
  { id: 'AUDCNY=X', name: 'AUD/CNY', sub: 'Yuan per Aussie dollar', group: 'rates', decimals: 4 },
  { id: 'AUDUSD=X', name: 'AUD/USD', sub: 'US dollars per Aussie dollar', group: 'rates', decimals: 4 },
  { id: 'CNY=X', name: 'USD/CNY', sub: 'Yuan per US dollar', group: 'rates', decimals: 4 },
  { id: '^HSI', name: 'Hang Seng', sub: 'Hong Kong', group: 'asia', decimals: 0 },
  { id: '000300.SS', name: 'CSI 300', sub: 'Mainland China', group: 'asia', decimals: 0 },
  { id: '^GSPC', name: 'S&P 500', sub: 'United States', group: 'global', decimals: 0 },
  { id: '^TNX', name: 'US 10-year yield', sub: 'Percent', group: 'global', decimals: 2 },
  { id: 'TIO=F', name: 'Iron ore', sub: 'US$ per tonne, futures', group: 'commodities', decimals: 2 },
  { id: 'BZ=F', name: 'Brent oil', sub: 'US$ per barrel', group: 'commodities', decimals: 2 },
  { id: 'GC=F', name: 'Gold', sub: 'US$ per ounce', group: 'commodities', decimals: 0 },
];

/** Daily closes (oldest first, gaps removed) from a Yahoo chart response. */
export function closesFrom(json) {
  const r = json?.chart?.result?.[0];
  const closes = r?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(closes)) return [];
  return closes.filter((v) => typeof v === 'number' && Number.isFinite(v));
}

/** Latest price and % change versus the previous daily close. */
export function quoteFrom(closes) {
  if (closes.length < 2) return { price: closes.at(-1) ?? null, change: null };
  const last = closes.at(-1);
  const prev = closes.at(-2);
  return { price: last, change: prev ? Math.round(((last - prev) / prev) * 10000) / 100 : null };
}

const round = (v, d) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);

export function buildQuote(t, closes) {
  const { price, change } = quoteFrom(closes);
  return { ...t, price: round(price, t.decimals + 1), change, closes: closes.slice(-22).map((v) => round(v, t.decimals + 1)) };
}

/** 1W/1M/6M/1Y slices from a year of daily closes. */
export function seriesFrom(closes) {
  return { '1W': closes.slice(-5), '1M': closes.slice(-22), '6M': closes.slice(-126), '1Y': closes };
}
