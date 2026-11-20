import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui';
import { addDays, todayShanghai } from '../lib/data';
import { dueCards, schedule, useCardsState } from '../lib/state';
import type { Card } from '../lib/types';
import { useFullDeck } from './Chinese';

const SWIPE = 90; // px past which a release commits
const FLICK = 0.5; // px/ms: a fast flick commits even when short

export default function Study() {
  const deck = useFullDeck();
  const [progress, update] = useCardsState();
  const today = todayShanghai();
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [again, setAgain] = useState(0);

  // Freeze today's queue once the deck has loaded, so cards don't reshuffle mid-session.
  useEffect(() => {
    if (queue === null && deck.length) setQueue(dueCards(deck, progress.cards, today));
  }, [deck, progress.cards, queue, today]);

  const card = queue?.[pos];

  const answer = (knew: boolean) => {
    if (!card) return;
    update((s) => ({ ...s, cards: { ...s.cards, [card.id]: schedule(s.cards[card.id], knew, today, addDays) } }), `Card ${card.id}`);
    if (!knew) setAgain((n) => n + 1);
    setFlipped(false);
    setPos((p) => p + 1);
  };

  // Keyboard: space flips, ← again, → got it.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft') answer(false);
      else if (e.key === 'ArrowRight') answer(true);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  if (!queue) return <div className="page focus" aria-busy="true" />;

  if (!card) {
    return (
      <div className="page focus">
        <Head pos={queue.length} total={queue.length} />
        <main style={{ flex: 1, paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 className="question">{queue.length ? 'Done for today' : 'Nothing due today'}</h1>
          <p className="feedback">
            {queue.length ? `${queue.length - again} known, ${again} to see again soon.` : 'New cards and reviews appear here each morning.'}
          </p>
        </main>
        <a className="btn primary block" href="#/chinese">
          Back to Chinese
        </a>
      </div>
    );
  }

  return (
    <div className="page focus">
      <Head pos={pos} total={queue.length} />
      <main style={{ flex: 1, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <span className="caption" style={{ textAlign: 'center', fontSize: 14 }}>
          {progress.cards[card.id] ? 'Review' : 'New'} · {card.deck}
        </span>
        <SwipeCard key={card.id} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} onSwipe={answer} />
        <span className="caption" style={{ textAlign: 'center' }}>
          Swipe left for again, right for got it
        </span>
      </main>
      <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button type="button" className="btn soft block" onClick={() => answer(false)}>
          Again
        </button>
        <button type="button" className="btn primary block" onClick={() => answer(true)}>
          Got it
        </button>
      </div>
    </div>
  );
}

function SwipeCard({ card, flipped, onFlip, onSwipe }: { card: Card; flipped: boolean; onFlip: () => void; onSwipe: (knew: boolean) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; t: number; dx: number; moved: boolean; hist: { x: number; t: number }[] } | null>(null);
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);

  const down = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, t: e.timeStamp, dx: 0, moved: false, hist: [{ x: e.clientX, t: e.timeStamp }] };
    setSettling(false);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const next = e.clientX - d.x;
    if (!d.moved && Math.abs(next) < 10) return; // small dead zone so taps still flip
    d.moved = true;
    d.dx = next;
    d.hist.push({ x: e.clientX, t: e.timeStamp });
    if (d.hist.length > 5) d.hist.shift();
    setDx(next);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      onFlip();
      return;
    }
    const a = d.hist[0];
    const b = d.hist[d.hist.length - 1];
    const v = (b.x - a.x) / Math.max(b.t - a.t, 1);
    setSettling(true);
    if (Math.abs(d.dx) > SWIPE || Math.abs(v) > FLICK) {
      const right = (Math.abs(v) > FLICK ? v : d.dx) > 0;
      setDx(right ? 600 : -600);
      setTimeout(() => onSwipe(right), 180);
    } else setDx(0);
  };

  const tilt = Math.max(-8, Math.min(8, dx / 25));
  return (
    <button
      ref={ref}
      type="button"
      className="flashcard"
      aria-label={flipped ? `${card.hz}: ${card.en}` : `${card.hz}. Tap to show meaning`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onFlip())}
      style={{
        transform: `translateX(${dx}px) rotate(${tilt}deg)`,
        transition: settling ? undefined : 'none',
        opacity: Math.abs(dx) > 400 ? 0 : 1,
        outline: dx > 40 ? '2px solid var(--up)' : dx < -40 ? '2px solid var(--accent)' : undefined,
      }}
    >
      <span className="hz" lang="zh-Hans">
        {card.hz}
      </span>
      <span className="py">{card.py}</span>
      {flipped ? (
        <>
          <span className="en">{card.en}</span>
          {card.pos ? <span className="caption">{card.pos}</span> : null}
          {card.ex?.length ? (
            <span className="ex">
              {card.ex.slice(0, 2).map(([zh, en], i) => (
                <span key={i}>
                  <span className="zh" lang="zh-Hans">
                    {zh}
                  </span>
                  <br />
                  <span className="caption">{en}</span>
                </span>
              ))}
            </span>
          ) : null}
        </>
      ) : (
        <span className="caption" style={{ marginTop: 18, fontSize: 15 }}>
          Tap to show meaning and example
        </span>
      )}
    </button>
  );
}

function Head({ pos, total }: { pos: number; total: number }) {
  return (
    <header className="focus-head">
      <a className="icon-btn" href="#/chinese" aria-label="Stop studying">
        <Icon.close />
      </a>
      <div className="progress" style={{ flex: 1 }}>
        <span style={{ width: `${(pos / Math.max(total, 1)) * 100}%` }} />
      </div>
      <span className="caption num" style={{ fontSize: 14 }}>
        {Math.min(pos + 1, total)} / {total}
      </span>
    </header>
  );
}
