import { useCallback, useEffect, useState } from 'react';
import { readState, readStateCached, updateState } from './sync';
import type { Card } from './types';

// What you did on a given morning: state/days/YYYY-MM-DD.json on the state branch.
export interface DayState {
  [key: string]: unknown;
  opened?: string;
  read: string[]; // section ids marked read
  quiz: Record<string, number | string>; // mc → option index, written → text
}

// Flashcard schedule: state/cards.json. Box n means "next due in INTERVALS[n] days".
export interface CardProgress {
  box: number;
  due: string; // YYYY-MM-DD
  seen: number;
  lapses: number;
}
export interface CardsState {
  [key: string]: unknown;
  cards: Record<string, CardProgress>;
}

export interface PredictionState {
  [key: string]: unknown;
  call?: number;
  justification?: string;
  lockedAt?: string;
}

export interface PendingCards {
  [key: string]: unknown;
  cards: Card[];
}

export const INTERVALS = [0, 1, 3, 7, 14, 30, 60];

function useStateFile<T extends Record<string, unknown>>(path: string | null, empty: T) {
  const [value, setValue] = useState<T>(() => (path ? readStateCached<T>(path) : null) ?? empty);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setValue(readStateCached<T>(path) ?? empty);
    readState<T>(path).then((v) => live && v && setValue(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  const update = useCallback(
    (fn: (cur: T) => T, message?: string) => {
      if (!path) return;
      setValue((cur) => fn(cur));
      updateState<T>(path, (cur) => fn(cur ?? empty), message).then(setValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path],
  );
  return [value, update] as const;
}

export function useDayState(date: string | null) {
  return useStateFile<DayState>(date ? `days/${date}.json` : null, { read: [], quiz: {} });
}

export function usePredictionState(week: string | null) {
  return useStateFile<PredictionState>(week ? `predictions/${week}.json` : null, {});
}

export function useCardsState() {
  return useStateFile<CardsState>('cards.json', { cards: {} });
}

export function usePending() {
  return useStateFile<PendingCards>('pending-cards.json', { cards: [] });
}

export function useApproved() {
  return useStateFile<PendingCards>('approved-cards.json', { cards: [] });
}

/** Cards due on `today`: never-seen cards count as due, up to `newLimit` of them. */
export function dueCards(deck: Card[], progress: Record<string, CardProgress>, today: string, newLimit = 10): Card[] {
  const due: Card[] = [];
  const fresh: Card[] = [];
  for (const c of deck) {
    const p = progress[c.id];
    if (!p) fresh.push(c);
    else if (p.due <= today) due.push(c);
  }
  due.sort((a, b) => (progress[a.id].due < progress[b.id].due ? -1 : 1));
  return [...due, ...fresh.slice(0, newLimit)];
}

export function schedule(p: CardProgress | undefined, knew: boolean, today: string, addDays: (d: string, n: number) => string): CardProgress {
  const box = knew ? Math.min((p?.box ?? 0) + 1, INTERVALS.length - 1) : 1;
  return {
    box,
    due: addDays(today, INTERVALS[box]),
    seen: (p?.seen ?? 0) + 1,
    lapses: (p?.lapses ?? 0) + (knew ? 0 : 1),
  };
}
