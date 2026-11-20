# Daily Financial News Watch

A 15-minute morning routine on phone and laptop: a finance **Brief** by topic,
a 5-question **Quiz**, a calm **Markets** page, **Chinese** practice with
flashcards, and a weekly prediction against Claude.

- Live site: https://bhazell272.github.io/bens-financial-dashboard/
- Preview with sample content: add `?demo` to the URL.

## How it works

| Piece | What it does |
|---|---|
| Static site (`src/`) | React + Vite. Reads JSON from `public/data/`. Works offline once loaded. |
| Morning Claude task | Researches the news and writes `public/data/days/<date>.json`, the quiz, the Chinese headline, progress. Pushes to `main`. See `docs/DATA.md`. |
| GitHub Action | On every push and at 06:20 Shanghai on weekdays: fetches delayed prices (`scripts/fetch-markets.mjs`), validates data, builds and publishes to GitHub Pages. |
| `state` branch | Your answers, flashcard schedule and predictions, written from the app through the GitHub API. Never deployed. |

## Run it locally

```bash
npm install
npm run dev
```

Open the printed `localhost` link; add `?demo` for sample content. Your phone
can open the "Network" address while on the same Wi‑Fi.

## Install on your phone

iPhone: open the site in Safari → Share → **Add to Home Screen**.
Laptop (Chrome): the install icon in the address bar.
Then **More → This device** to connect sync (one token per device).

## Commands

- `npm run build`: type-check and build to `dist/`
- `npm test`: unit tests for the market-data parser
- `npm run validate`: check `public/data/` against the contract
- `npm run markets`: fetch prices locally (needs internet access to Yahoo Finance)
