# Data contract for the scheduled tasks

The site is static. Three scheduled Claude tasks write JSON into `public/data/`
on `main`, and the site rebuilds on every push. Your saved activity (quiz
answers, flashcards, predictions) lives on the separate `state` branch, which
is never deployed. Types are in `src/lib/types.ts`; `npm run validate` checks
everything below and **must pass before every commit**.

All dates are Shanghai dates (`Asia/Shanghai`), `YYYY-MM-DD`.

## Daily task (weekdays, ~06:45 Shanghai)

1. Clone `main` and fetch the `state` branch:
   `git fetch origin state:state` (ignore an error if it doesn't exist yet).
   Read state files with `git show state:<path>`.
2. Write `public/data/days/<today>.json` (`Day` type):
   - `top`: 3 items `{h, d}`, most important first.
   - `sections`: always these ids, in this order, with these names:
     `westpac` Westpac · `banks` Big four banks · `regulation` Regulation ·
     `wealth` Wealth & super · `business` Business banking ·
     `china` Australia–China · `hk` Hong Kong · `citi` Citi · `global` Global.
     Each has `minutes` (reading estimate) and 1–2 `items`
     `{h, d, why, sources:[{title,url,paywalled?}], when?, mention?}`.
     On a quiet topic, `items: []` and a `background: {h, d}` explainer that
     hasn't been used in the last 10 days.
   - `readMinutes`: total, aim 10–15.
   - `primer`: 2–4 `{term, text}` concepts used in today's stories, not
     repeated from the last 10 days.
   - `quiz`: exactly 5. Four `mc` `{id, type:'mc', q, options[4], answer,
     explain, from, topic}` and one `written` `{id, type:'written', q, topic}`
     last. Ids are `<date>-q1`…`q5`. At least 2 mc questions re-test material
     the user got wrong on earlier days (see step 4); the rest come from
     the last 3 days of briefs. `topic` is a section id.
   - `chinese`: one real Chinese finance headline rewritten at HSK 2,
     `segments` with `py` only on the 3–5 new words, `english`, `original`
     (real URL), `words`. New words must not already be in
     `public/data/cards/deck.json`.
   - `marked`: if `state:days/<previous weekday>.json` has a written answer,
     mark it: `{date, q, score (0–10), feedback, model}`.
   - `markets`: `{summary, forWestpac, extras}` where `extras` holds what the
     price feed can't: RBA cash rate (with market-implied next move),
     Australia 10-year yield, and anything else notable, as
     `{name, sub, value, change?}`. Never invent a number: leave it out.
3. Append today's new Chinese words to `public/data/cards/deck.json` with
   `deck: "Finance words"` and ids `fin-<date>-<n>`.
4. Spaced repetition: read the last 14 `state:days/*.json`. Wrong mc answers
   (`quiz[id] !== answer`) are candidates to re-test, rephrased.
5. Update `public/data/index.json`: `latest` = today, prepend to `days`.
6. Update `public/data/progress.json` (`Progress` type) from the state
   branch: streak = consecutive weekdays with `opened`, quiz accuracy over
   30 days, written average, predictions tally, `wordsKnown` = cards in
   `state:cards.json` with `box >= 3`, weakest = 3 lowest-accuracy topics.
7. PDF inbox: for each `state:inbox/*.pdf` not yet processed, extract
   vocabulary into `state:pending-cards.json` (`{cards: Card[]}`, ids
   `pdf-<file>-<n>`, `deck` = the PDF's lesson name), then delete the PDF on
   the `state` branch. This is the one write the task makes to `state`.
8. `npm run validate`, then commit and push `main`.

## Predictions (set by the Monday daily run, scored by the Friday weekly task)

- Monday: if `public/data/predictions/<monday>.json` already exists, keep it. Otherwise write it:
  `{week, question, options:[a,b], now, closesAt (Monday 23:00 Shanghai, ISO),
  claude: base64(JSON {call, justification})}` and set
  `index.currentPrediction`. Questions rotate: RBA, AUD/CNY or AUD/USD
  level, ASX 200 or Westpac weekly direction, Hang Seng direction. A clear
  yes/no answer by Friday's close.
- Friday evening (weekly digest task, after the markets close): add `result: {answer, actual, you?, claude, claudeSaw, youSaw?}`.
  Read the user's call from `state:predictions/<monday>.json`. Score both
  justifications 0–3 on `evidence`, `mechanism`, `risk`, separately from
  who was right. Append to `progress.reasoning`.

## Weekly digest (Friday evening)

Write `public/data/weeks/<monday>.json` (`Week` type) from the week's
`days/*.json`, prepend its id to `index.weeks`, score this week's prediction
(above), validate, push.

## Careers check (Tuesday morning)

Rewrite `public/data/careers.json` (`Careers` type). Only dates confirmed on
official pages get `confirmed: true`. Never invent a deadline.

## Rules for all tasks

- If WebFetch can't reach a site, work from search results, but say so in your report and prefer stories whose snippets give the facts plainly.

- Paraphrase; no long quotes. Paywalled sources (AFR): headline and link
  only, `paywalled: true`, never claim to have read them.
- Every story needs at least one real source URL.
- If validation fails, fix the data; never commit invalid data.
