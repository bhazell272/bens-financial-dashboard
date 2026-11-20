// Checks every content file in public/data/ against the shapes the site
// expects. The morning task runs this before committing; CI runs it before
// publishing. Exits non-zero with a list of problems.
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../public/data/', import.meta.url);
const problems = [];
const need = (cond, where, msg) => cond || problems.push(`${where}: ${msg}`);
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function json(path) {
  try {
    return JSON.parse(await readFile(new URL(path, root), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return undefined;
    problems.push(`${path}: not valid JSON (${e.message})`);
    return undefined;
  }
}
async function list(dir) {
  try {
    return (await readdir(new URL(dir, root))).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}

const index = await json('index.json');
need(index, 'index.json', 'missing');
if (index) {
  need(index.latest === null || DATE.test(index.latest), 'index.json', 'latest must be null or YYYY-MM-DD');
  need(Array.isArray(index.days) && Array.isArray(index.weeks), 'index.json', 'days and weeks must be arrays');
  if (index.latest) need(index.days[0] === index.latest, 'index.json', 'days[0] must equal latest (newest first)');
  for (const d of index.days ?? []) need((await list('days/')).includes(`${d}.json`), 'index.json', `lists ${d} but days/${d}.json is missing`);
  for (const w of index.weeks ?? []) need((await list('weeks/')).includes(`${w}.json`), 'index.json', `lists week ${w} but weeks/${w}.json is missing`);
  if (index.currentPrediction) need((await list('predictions/')).includes(`${index.currentPrediction}.json`), 'index.json', 'currentPrediction file missing');
}

for (const f of await list('days/')) {
  const d = await json(`days/${f}`);
  const at = `days/${f}`;
  if (!d) continue;
  need(d.date + '.json' === f, at, 'date must match the file name');
  need(Array.isArray(d.top) && d.top.length >= 1 && d.top.length <= 3 && d.top.every((t) => str(t.h)), at, 'top needs 1–3 items with h');
  need(Array.isArray(d.sections) && d.sections.length > 0, at, 'sections missing');
  for (const s of d.sections ?? []) {
    need(str(s.id) && str(s.name) && typeof s.minutes === 'number', `${at} ${s.id}`, 'section needs id, name, minutes');
    need(Array.isArray(s.items), `${at} ${s.id}`, 'items must be an array');
    need((s.items?.length ?? 0) > 0 || (s.background && str(s.background.h)), `${at} ${s.id}`, 'needs items or a background explainer');
    for (const it of s.items ?? []) {
      need(str(it.h) && str(it.d) && str(it.why), `${at} ${s.id}`, `story "${it.h}" needs h, d and why`);
      need(Array.isArray(it.sources) && it.sources.length > 0 && it.sources.every((x) => str(x.title) && /^https?:\/\//.test(x.url)), `${at} ${s.id}`, `story "${it.h}" needs sources with real URLs`);
    }
  }
  need(Array.isArray(d.quiz) && d.quiz.length === 5, at, 'quiz must have exactly 5 questions');
  const ids = new Set();
  for (const q of d.quiz ?? []) {
    need(!ids.has(q.id), at, `duplicate quiz id ${q.id}`);
    ids.add(q.id);
    if (q.type === 'mc') {
      need(Array.isArray(q.options) && q.options.length === 4, `${at} ${q.id}`, 'mc needs 4 options');
      need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options?.length ?? 0), `${at} ${q.id}`, 'answer index out of range');
      need(str(q.explain), `${at} ${q.id}`, 'explain missing');
    } else need(q.type === 'written' && str(q.q), `${at} ${q.id}`, 'unknown question type');
  }
  need((d.quiz ?? []).filter((q) => q.type === 'written').length === 1, at, 'exactly one written question');
  if (d.chinese) {
    need(Array.isArray(d.chinese.segments) && d.chinese.segments.length > 0, `${at} chinese`, 'segments missing');
    need(Array.isArray(d.chinese.words) && d.chinese.words.every((w) => str(w.hz) && str(w.py) && str(w.en)), `${at} chinese`, 'words need hz, py, en');
    need(d.chinese.original && /^https?:\/\//.test(d.chinese.original.url ?? ''), `${at} chinese`, 'original needs a URL');
  }
}

for (const f of await list('predictions/')) {
  const p = await json(`predictions/${f}`);
  if (!p) continue;
  need(Array.isArray(p.options) && p.options.length === 2, `predictions/${f}`, 'needs exactly 2 options');
  try {
    const c = JSON.parse(Buffer.from(p.claude, 'base64').toString('utf8'));
    need(c.call === 0 || c.call === 1, `predictions/${f}`, 'claude.call must be 0 or 1');
  } catch {
    problems.push(`predictions/${f}: claude must be base64 JSON {call, justification}`);
  }
}

const deck = await json('cards/deck.json');
if (deck) {
  const seen = new Set();
  for (const c of deck.cards) {
    need(str(c.id) && str(c.hz) && str(c.py) && str(c.en) && str(c.deck), 'cards/deck.json', `card ${c.id} incomplete`);
    need(!seen.has(c.id), 'cards/deck.json', `duplicate card id ${c.id}`);
    seen.add(c.id);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n- ` + problems.join('\n- '));
  process.exit(1);
}
console.log('data ok');
