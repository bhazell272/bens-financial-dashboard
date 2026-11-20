import { useEffect, useState } from 'react';
import type { Card, Careers, Day, Index, Markets, Prediction, Progress, Week } from './types';

// ?demo shows the sample content in public/demo/, so the design can be
// previewed before the first morning run has written any real data.
export const DEMO = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
const BASE = DEMO ? './demo/' : './data/';

const memo = new Map<string, Promise<unknown>>();

export function loadJson<T>(path: string): Promise<T | null> {
  if (!memo.has(path)) {
    memo.set(
      path,
      fetch(BASE + path, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return memo.get(path) as Promise<T | null>;
}

export function useJson<T>(path: string | null): { data: T | null; loading: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: !!path });
  useEffect(() => {
    let live = true;
    if (!path) {
      setState({ data: null, loading: false });
      return;
    }
    setState((s) => ({ data: s.data, loading: true }));
    loadJson<T>(path).then((data) => live && setState({ data, loading: false }));
    return () => {
      live = false;
    };
  }, [path]);
  return state;
}

export const useIndex = () => useJson<Index>('index.json');
export const useDay = (date: string | null) => useJson<Day>(date ? `days/${date}.json` : null);
export const useWeek = (id: string | null) => useJson<Week>(id ? `weeks/${id}.json` : null);
export const useMarkets = () => useJson<Markets>('markets.json');
export const useCareers = () => useJson<Careers>('careers.json');
export const useProgress = () => useJson<Progress>('progress.json');
export const usePrediction = (id: string | null) => useJson<Prediction>(id ? `predictions/${id}.json` : null);
export const useDeck = () => useJson<{ cards: Card[] }>('cards/deck.json');

/** Today's date in Shanghai as YYYY-MM-DD (the user reads on Shanghai time). */
export function todayShanghai(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Monday of the week containing iso, as YYYY-MM-DD. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

export function greeting(d = new Date()): string {
  const h = Number(new Intl.DateTimeFormat('en-AU', { timeZone: 'Asia/Shanghai', hour: 'numeric', hourCycle: 'h23' }).format(d));
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function decodeClaude(b64: string): { call: number; justification: string } | null {
  try {
    const bin = atob(b64);
    const text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    return JSON.parse(text);
  } catch {
    return null;
  }
}
