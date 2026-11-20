// One-off importer: turns a saved "Palm Cards" page (claude.ai artifact HTML)
// into public/data/cards/deck.json. Reads the LESSONS array as JSON; never
// executes the page's script.
// Usage: node scripts/import-palmcards.mjs <saved.html> "<deck prefix>"
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const [file, prefix = 'Level 2'] = process.argv.slice(2);
const html = await readFile(file, 'utf8');
const start = html.indexOf('var LESSONS = [');
if (start === -1) throw new Error('No LESSONS array found');
const from = start + 'var LESSONS = '.length;
const end = html.indexOf('];', from);
const lessons = JSON.parse(html.slice(from, end + 1));

const OUT = new URL('../public/data/cards/deck.json', import.meta.url);
let existing = { cards: [] };
try {
  existing = JSON.parse(await readFile(OUT, 'utf8'));
} catch {}

const seen = new Set(existing.cards.map((c) => c.hz + '|' + c.en));
const cards = [...existing.cards];
let added = 0;
for (const l of lessons) {
  l.cards.forEach((c, i) => {
    const key = c.hz + '|' + c.en;
    if (seen.has(key)) return;
    seen.add(key);
    cards.push({
      id: `l2-${l.n}-${i}`,
      hz: c.hz,
      py: c.py,
      en: c.en,
      ...(c.pos ? { pos: c.pos } : {}),
      ...(c.ex?.length ? { ex: c.ex } : {}),
      deck: `${prefix} · Lesson ${l.n}`,
    });
    added++;
  });
}
await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), cards }, null, 0) + '\n');
console.log(`${lessons.length} lessons, ${added} cards added, ${cards.length} total`);
