import { useState } from 'react';
import { AskClaude, Icon, Row } from '../ui';
import { todayShanghai, useDay, useDeck, useIndex } from '../lib/data';
import { dueCards, useApproved, useCardsState, usePending } from '../lib/state';
import type { Card } from '../lib/types';

/** The full deck: the imported palm cards + finance words from past headlines + approved PDF cards. */
export function useFullDeck(): Card[] {
  const { data: deck } = useDeck();
  const [approved] = useApproved();
  const seen = new Set<string>();
  const out: Card[] = [];
  for (const c of [...(deck?.cards ?? []), ...approved.cards]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

export default function Chinese() {
  const { data: index } = useIndex();
  const { data: day } = useDay(index?.latest ?? null);
  const [showEnglish, setShowEnglish] = useState(false);
  const deck = useFullDeck();
  const [progress] = useCardsState();
  const [pending] = usePending();
  const due = dueCards(deck, progress.cards, todayShanghai());
  const zh = day?.chinese;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="large-title">Chinese</h1>
          <p className="subtitle">One headline, a few new words, then cards</p>
        </div>
        <AskClaude context={zh ? `Today's Chinese headline: ${zh.segments.map((s) => s.t).join('')}` : 'I am learning Chinese at HSK 2 level.'} />
      </div>

      {zh ? (
        <>
          <section className="panel" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="zh-reading" lang="zh-Hans">
              {zh.segments.map((s, i) =>
                s.py ? (
                  <ruby key={i}>
                    {s.t}
                    <rt>{s.py}</rt>
                  </ruby>
                ) : (
                  <span key={i}>{s.t}</span>
                ),
              )}
            </p>
            {showEnglish ? (
              <p className="feedback" style={{ color: 'var(--ink)' }} aria-live="polite">
                {zh.english}
              </p>
            ) : (
              <button type="button" className="btn" style={{ background: 'var(--surface-2)' }} onClick={() => setShowEnglish(true)}>
                Show English
              </button>
            )}
            <span className="caption">
              Rewritten at HSK 2 from a real headline ·{' '}
              <a className="link" href={zh.original.url} target="_blank" rel="noopener noreferrer">
                Original ({zh.original.title})
              </a>
            </span>
          </section>

          <h2 className="group-title">New words</h2>
          <div className="list">
            {zh.words.map((w) => (
              <div className="row" key={w.hz} style={{ justifyContent: 'flex-start', gap: 16 }}>
                <span className="han" lang="zh-Hans" style={{ fontSize: 22, fontWeight: 500, minWidth: 64 }}>
                  {w.hz}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{w.py}</span>
                  <span style={{ color: 'var(--ink-2)' }}>{w.en}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="footnote">Added to your cards automatically.</p>
        </>
      ) : (
        <p className="lede muted">Today's headline arrives with the morning brief.</p>
      )}

      <a className="next-card" href="#/chinese/study" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
        <span>
          <strong>Review flashcards</strong>
          <small>
            {due.length} due · about {Math.max(1, Math.round(due.length / 3))} min · {deck.length} cards in total
          </small>
        </span>
        <Icon.arrow />
      </a>

      <div className="list" style={{ marginTop: 12 }}>
        <Row href="#/chinese/review" title={pending.cards.length ? `${pending.cards.length} imported cards to approve` : 'Import a PDF'} sub="Vocab lists and lesson notes become cards" />
      </div>
    </div>
  );
}
