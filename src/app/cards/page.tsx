'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CARD_TOPICS, cardTopicName, cardsIn, DATA, topicById, type Card } from '@/lib/data';
import { fmtDuration, shuffle } from '@/lib/format';
import { read, remove, useMounted, useStored, write, type CardState } from '@/lib/store';

// Leitner boxes. Box 1 is always due. Knowing a card moves it up a box and
// schedules it later; missing it sends it back to box 1 and repeats it soon.
const BOX_DELAY = [0, 0, 10 * 60e3, 60 * 60e3, 8 * 3600e3, 24 * 3600e3];
const MAX_BOX = 5;

export default function CardsPage() {
  return (
    <Suspense fallback={<div className="page" />}>
      <Flashcards />
    </Suspense>
  );
}

function Flashcards() {
  const params = useSearchParams();
  const router = useRouter();
  const topic = params.get('topic') ?? '';
  const mounted = useMounted();
  const [state] = useStored<CardState>('cards', {});
  const [queue, setQueue] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [ahead, setAhead] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  const pool = useMemo(() => cardsIn(topic), [topic]);
  const dueIn = useCallback((cards: Card[]) => {
    const st = read<CardState>('cards', {});
    const now = Date.now();
    return cards.filter((c) => !st[c.id] || st[c.id].due <= now);
  }, []);

  const start = useCallback(
    (studyAhead: boolean) => {
      const st = read<CardState>('cards', {});
      const base = studyAhead ? pool.slice() : dueIn(pool);
      // Lowest box first, shuffled within each box; new cards count as box 1.
      const q = shuffle(base).sort((a, b) => (st[a.id]?.box || 1) - (st[b.id]?.box || 1));
      setCurrent(q[0] ?? null);
      setQueue(q.slice(1));
      setRevealed(false);
    },
    [pool, dueIn],
  );

  useEffect(() => {
    if (!mounted) return;
    setAhead(false);
    setSessionDone(0);
    start(false);
  }, [mounted, topic, start]);

  const answer = useCallback(
    (knew: boolean) => {
      if (!current || !revealed) return;
      const st = read<CardState>('cards', {});
      const s = st[current.id] ?? { box: 1, right: 0, wrong: 0, due: 0 };
      let rest = queue;
      if (knew) {
        s.box = Math.min(MAX_BOX, s.box + 1);
        s.right++;
      } else {
        s.box = 1;
        s.wrong++;
        const at = Math.min(rest.length, 3 + Math.floor(Math.random() * 3));
        rest = [...rest.slice(0, at), current, ...rest.slice(at)];
      }
      s.due = Date.now() + BOX_DELAY[s.box];
      write('cards', { ...st, [current.id]: s });
      setSessionDone((n) => n + 1);
      setCurrent(rest[0] ?? null);
      setQueue(rest.slice(1));
      setRevealed(false);
    },
    [current, revealed, queue],
  );

  const keyRef = useRef({ answer, current, revealed });
  keyRef.current = { answer, current, revealed };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, select, textarea, button')) {
        if (e.key === ' ') return;
      }
      const { answer, current, revealed } = keyRef.current;
      if (e.key === ' ' && current && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if ((e.key === 'k' || e.key === 'ArrowRight') && revealed) answer(true);
      else if ((e.key === 'j' || e.key === 'ArrowLeft') && revealed) answer(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const now = mounted ? Date.now() : 0;
  const dueNow = mounted ? pool.filter((c) => !state[c.id] || state[c.id].due <= now).length : 0;
  const soonest = pool
    .map((c) => state[c.id]?.due ?? 0)
    .filter((d) => d > now)
    .sort((a, b) => a - b)[0];
  const topicLabel = topic ? (topicById[topic] ? topicById[topic].title : cardTopicName(topic)) : '';
  const box = current ? state[current.id]?.box : undefined;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h1">Flashcards</h1>
          <p className="lede">
            {mounted ? `${dueNow} of ${pool.length} due` : ' '}
            {topicLabel ? ` in ${topicLabel}` : ''}. Cards you miss come back within a few cards.
          </p>
        </div>
        <label className="select">
          <span className="sr-only">Topic</span>
          <select
            value={topic}
            onChange={(e) => router.push(e.target.value ? `/cards/?topic=${encodeURIComponent(e.target.value)}` : '/cards/')}
          >
            <option value="">All topics ({DATA.cards.length})</option>
            {topic && !CARD_TOPICS.includes(topic) && topicById[topic] && (
              <option value={topic}>{topicById[topic].title} ({pool.length})</option>
            )}
            {CARD_TOPICS.map((t) => (
              <option key={t} value={t}>{cardTopicName(t)} ({cardsIn(t).length})</option>
            ))}
          </select>
        </label>
      </header>

      <div className="fc">
        <div className="fc-main">
          <article className={`flash ${revealed ? 'is-revealed' : ''}`} aria-live="polite">
            {!mounted ? null : current ? (
              <>
                <div className="flash-meta">
                  <span>{cardTopicName(current.topic)}</span>
                  <span>{box ? `Box ${box}` : 'New card'}</span>
                  <span className="flash-left">{queue.length} left in this session</span>
                </div>
                <p className="flash-front">{current.front}</p>
                {revealed && <div className={`flash-back ${/\n/.test(current.back) ? 'is-code' : ''}`}>{current.back}</div>}
                <div className="flash-actions">
                  {revealed ? (
                    <>
                      <button type="button" className="btn miss" onClick={() => answer(false)}>Missed it <kbd>J</kbd></button>
                      <button type="button" className="btn knew" onClick={() => answer(true)}>Knew it <kbd>K</kbd></button>
                    </>
                  ) : (
                    <button type="button" className="btn primary" onClick={() => setRevealed(true)}>Show answer <kbd>Space</kbd></button>
                  )}
                </div>
              </>
            ) : (
              <div className="flash-empty">
                <p className="flash-front">
                  {sessionDone ? `Session done: ${sessionDone} cards reviewed.` : `Nothing due${topicLabel ? ' in this topic' : ''} right now.`}
                </p>
                <p className="lede">{soonest ? `The next card comes due in ${fmtDuration(soonest - now)}.` : 'Every card is scheduled.'} You can keep going anyway.</p>
                <div className="flash-actions">
                  <button type="button" className="btn primary" onClick={() => { setAhead(true); start(true); }}>
                    {ahead ? 'Go through them again' : `Study ahead (${pool.length} cards)`}
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>
        <Progress pool={pool} state={mounted ? state : {}} />
      </div>
    </div>
  );
}

function Progress({ pool, state }: { pool: Card[]; state: CardState }) {
  const counts = [0, 0, 0, 0, 0, 0];
  pool.forEach((c) => counts[state[c.id]?.box ?? 0]++);
  const max = Math.max(1, ...counts);
  const names = ['New', '1', '2', '3', '4', '5'];
  return (
    <aside className="panel fc-side" aria-label="Progress">
      <h2 className="h2">Boxes</h2>
      <div className="boxes" role="img" aria-label={counts.map((n, i) => `${i ? `box ${i}` : 'new'}: ${n}`).join(', ')}>
        {counts.map((n, i) => (
          <div key={i} className={`box box-${i}`}>
            <span className="box-n">{n}</span>
            <span className="box-col"><i style={{ height: `${(100 * n) / max}%` }} /></span>
            <span className="box-name">{names[i]}</span>
          </div>
        ))}
      </div>
      <p className="fine">A card reaches box 5 after five correct answers in a row; one miss sends it back to box 1.</p>
      <h2 className="h2 spaced">By topic</h2>
      <ul className="topic-bars">
        {CARD_TOPICS.map((t) => {
          const cs = cardsIn(t);
          const up = cs.filter((c) => (state[c.id]?.box ?? 0) >= 4).length;
          return (
            <li key={t}>
              <a href={`/cards/?topic=${encodeURIComponent(t)}`}>{cardTopicName(t)}</a>
              <span className="num">{up}/{cs.length}</span>
              <span className="score-bar" aria-hidden><i style={{ width: `${(100 * up) / cs.length}%` }} /></span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="link-btn danger"
        onClick={() => {
          if (confirm('Reset all flashcard progress? This cannot be undone.')) remove('cards');
        }}
      >
        Reset flashcard progress
      </button>
    </aside>
  );
}
