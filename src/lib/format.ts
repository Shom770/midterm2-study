export function fmtClock(ms: number) {
  const neg = ms < 0;
  const t = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${neg ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function fmtDuration(ms: number) {
  if (ms <= 0) return 'now';
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : `${m}m`;
}

/** Days, hours, minutes and seconds left, each clamped at zero. */
export function splitDuration(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** YYYY-MM-DD in New York time, to match the plan's dates. */
export const todayKey = (now = Date.now()) => new Date(now).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
