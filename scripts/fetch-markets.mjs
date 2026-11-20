// Fetches delayed prices from Yahoo Finance's public chart endpoint and writes
// public/data/markets.json. Runs in GitHub Actions before each build.
// Anything that fails is written as null ("Unavailable" in the app), never guessed.
import { writeFile, mkdir } from 'node:fs/promises';
import { TICKERS, buildQuote, closesFrom, quoteFrom, seriesFrom } from './markets-lib.mjs';

const OUT = new URL('../public/data/markets.json', import.meta.url);

async function chart(symbol, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; daily-finance-dashboard)' } });
      if (res.ok) return closesFrom(await res.json());
      console.warn(`${symbol}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`${symbol}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return [];
}

const quotes = [];
for (const t of TICKERS) quotes.push(buildQuote(t, await chart(t.id, '1mo')));

const asxCloses = await chart('^AXJO', '1y');
const asx = asxCloses.length ? { ...quoteFrom(asxCloses), series: seriesFrom(asxCloses) } : undefined;

const missing = quotes.filter((q) => q.price === null).map((q) => q.name);
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), quotes, asx }, null, 1) + '\n');
console.log(`markets.json: ${quotes.length - missing.length}/${quotes.length} quotes${asx ? ', ASX 200 ok' : ', ASX 200 missing'}`);
if (missing.length) console.log(`Unavailable: ${missing.join(', ')}`);
