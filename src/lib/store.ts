'use client';
// Progress lives in localStorage under m2arena.v1.* keys, the same keys and
// export format as the original single-file app, so old exports still import.
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

export const PREFIX = 'm2arena.v1.';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIX)) l();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

function rawGet(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function read<T>(key: string, fallback: T): T {
  const raw = rawGet(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown) {
  try {
    if (value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
  emit();
}

export const remove = (key: string) => write(key, undefined);

/** A localStorage-backed value. Renders `fallback` on the server and until hydrated. */
export function useStored<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const raw = useSyncExternalStore(subscribe, () => rawGet(key), () => null);
  // `fallback` is usually a fresh literal; only the raw string decides when to re-parse.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => (raw == null ? fallback : safeParse(raw, fallback)), [raw]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      write(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Current time, ticking every `ms`. Null until mounted so server and client markup match. */
export function useNow(ms = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function exportProgress() {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) out[k] = localStorage.getItem(k) ?? '';
    }
  } catch {}
  const blob = new Blob(
    [JSON.stringify({ app: 'm2arena', version: 1, exportedAt: new Date().toISOString(), data: out }, null, 2)],
    { type: 'application/json' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `m2arena-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importProgress(file: File) {
  const parsed = JSON.parse(await file.text());
  if (parsed?.app !== 'm2arena' || typeof parsed.data !== 'object') throw new Error('this file is not an M2 Arena export');
  if (!confirm('Replace your current progress with this file?')) return false;
  for (const [k, v] of Object.entries(parsed.data)) {
    if (k.startsWith(PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
  }
  emit();
  return true;
}

// ---------- shared domain state ----------

export type CardState = Record<string, { box: number; right: number; wrong: number; due: number }>;
export type Attempt = {
  id: string;
  examId: string;
  finishedAt: number;
  score: number;
  total: number;
  minutes: number;
  elapsedMs: number;
  scores: Record<string, number>;
};
export type Run = {
  minutes: number;
  elapsedMs: number;
  runningSince: number | null;
  revealed: Record<string, boolean>;
  scores: Record<string, number>;
};
