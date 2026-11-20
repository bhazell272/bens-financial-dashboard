// Saves what you do (quiz answers, read sections, flashcard progress,
// predictions) so phone and laptop agree.
//
// Everything is written to localStorage first, so the app works offline and
// without a token. When a GitHub token is set (More → This device), each
// change is also committed to the `state` branch of the repo through the
// GitHub contents API. The `state` branch is never deployed, so saving an
// answer doesn't rebuild the site.

export const REPO = { owner: 'bhazell272', name: 'bens-financial-dashboard', branch: 'state' };

import { DEMO } from './data';

const API = 'https://api.github.com';
const TOKEN_KEY = 'dfnw.token';
// Demo mode keeps its own local copy and never syncs, so sample answers can't touch real progress.
const CACHE = DEMO ? 'dfnw.demo:' : 'dfnw.cache:';

type Json = Record<string, unknown>;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or storage full: keep going in memory */
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  if (DEMO) return null;
  return safeGet(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) safeSet(TOKEN_KEY, token.trim());
  else safeRemove(TOKEN_KEY);
}

function readCache<T>(path: string): T | null {
  const raw = safeGet(CACHE + path);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function writeCache(path: string, data: unknown) {
  safeSet(CACHE + path, JSON.stringify(data));
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function gh(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error('no-token');
  return fetch(API + path, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
}

const contentsUrl = (path: string) =>
  `/repos/${REPO.owner}/${REPO.name}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;

async function ensureBranch(): Promise<void> {
  const r = await gh(`/repos/${REPO.owner}/${REPO.name}/git/ref/heads/${REPO.branch}`);
  if (r.ok) return;
  if (r.status !== 404) throw new Error(`branch check failed (${r.status})`);
  const main = await gh(`/repos/${REPO.owner}/${REPO.name}/git/ref/heads/main`);
  if (!main.ok) throw new Error(`could not read main (${main.status})`);
  const { object } = (await main.json()) as { object: { sha: string } };
  const create = await gh(`/repos/${REPO.owner}/${REPO.name}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${REPO.branch}`, sha: object.sha }),
  });
  if (!create.ok && create.status !== 422) throw new Error(`could not create state branch (${create.status})`);
}

async function remoteRead<T>(path: string): Promise<{ data: T | null; sha?: string }> {
  const r = await gh(`${contentsUrl(path)}?ref=${REPO.branch}`);
  if (r.status === 404) return { data: null };
  if (!r.ok) throw new Error(`read ${path} failed (${r.status})`);
  const body = (await r.json()) as { content: string; sha: string };
  return { data: JSON.parse(fromBase64(body.content)) as T, sha: body.sha };
}

/** Read a state file: the cached copy right away, then the synced copy if a token is set. */
export async function readState<T>(path: string): Promise<T | null> {
  const cached = readCache<T>(path);
  if (!getToken()) return cached;
  try {
    const { data } = await remoteRead<T>(path);
    if (data) {
      writeCache(path, data);
      return data;
    }
    return cached;
  } catch {
    return cached;
  }
}

export function readStateCached<T>(path: string): T | null {
  return readCache<T>(path);
}

export type SyncStatus = 'local' | 'saving' | 'synced' | 'error';
type Listener = (s: SyncStatus, detail?: string) => void;
const listeners = new Set<Listener>();
let status: SyncStatus = getToken() ? 'synced' : 'local';
export function onSyncStatus(fn: Listener) {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}
function emit(s: SyncStatus, detail?: string) {
  status = s;
  listeners.forEach((fn) => fn(s, detail));
}

/**
 * Change a state file. `update` receives the latest copy (remote when
 * possible) and returns the new one. On a conflict (the other device saved
 * in between) the update is re-applied to the newer copy, so nothing is lost.
 */
export async function updateState<T extends Json>(path: string, update: (current: T | null) => T, message?: string): Promise<T> {
  const local = update(readCache<T>(path));
  writeCache(path, local);
  if (!getToken()) {
    emit('local');
    return local;
  }
  emit('saving');
  try {
    await ensureBranch();
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, sha } = await remoteRead<T>(path);
      const next = update(data);
      const r = await gh(contentsUrl(path), {
        method: 'PUT',
        body: JSON.stringify({
          message: message || `Update ${path}`,
          content: toBase64(JSON.stringify(next, null, 2) + '\n'),
          branch: REPO.branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (r.ok) {
        writeCache(path, next);
        emit('synced');
        return next;
      }
      if (r.status !== 409 && r.status !== 422) throw new Error(`save failed (${r.status})`);
    }
    throw new Error('save kept conflicting');
  } catch (e) {
    emit('error', e instanceof Error ? e.message : String(e));
    return local;
  }
}

/** Upload a PDF to the state branch's inbox/ for the next morning run to turn into cards. */
export async function uploadPdf(file: File): Promise<string> {
  if (!getToken()) throw new Error('Connect this device first (More → This device).');
  if (file.size > 20 * 1024 * 1024) throw new Error('That PDF is over 20 MB. Split it and try again.');
  await ensureBranch();
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+/, '') || 'upload.pdf';
  const path = `inbox/${new Date().toISOString().slice(0, 10)}-${safe}`;
  const r = await gh(contentsUrl(path), {
    method: 'PUT',
    body: JSON.stringify({ message: `Upload ${safe}`, content: btoa(bin), branch: REPO.branch }),
  });
  if (!r.ok) throw new Error(`Upload failed (${r.status}).`);
  return path;
}

/** Check a token works and can write to the repo. */
export async function testToken(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const r = await fetch(`${API}/repos/${REPO.owner}/${REPO.name}`, {
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/vnd.github+json' },
    });
    if (r.status === 401) return { ok: false, message: 'GitHub rejected that token. Check you copied all of it.' };
    if (r.status === 404) return { ok: false, message: 'That token can’t see the repository. Give it access to bens-financial-dashboard.' };
    if (!r.ok) return { ok: false, message: `GitHub answered ${r.status}. Try again in a minute.` };
    const body = (await r.json()) as { permissions?: { push?: boolean } };
    if (body.permissions && !body.permissions.push)
      return { ok: false, message: 'The token can read but not write. Set Contents to “Read and write”.' };
    return { ok: true, message: 'Connected. Your answers now sync between devices.' };
  } catch {
    return { ok: false, message: 'Couldn’t reach GitHub. Check your connection or VPN.' };
  }
}
