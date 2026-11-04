'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { Workbench } from '@/components/Workbench';
import { examById, examItems, KEY_STATUS, type Exam, type Item } from '@/lib/data';
import { fmtClock } from '@/lib/format';
import { read, remove, useMounted, useNow, useStored, write, type Attempt, type Run } from '@/lib/store';

const EXAM_TAIL = {};
const elapsed = (run: Run, now: number) => run.elapsedMs + (run.runningSince ? now - run.runningSince : 0);

export function ExamRunner({ id }: { id: string }) {
  const exam = examById[id];
  const router = useRouter();
  const mounted = useMounted();
  const now = useNow(250);
  const fresh: Run = { minutes: exam.minutes, elapsedMs: 0, runningSince: null, revealed: {}, scores: {} };
  const [stored, setRun] = useStored<Run | null>(`run.${exam.id}`, null);
  const run = (mounted && stored) || fresh;
  const update = (fn: (r: Run) => Run) => setRun((prev) => fn(prev ?? fresh));
  const items = examItems(exam);

  // Jump to an item linked from the topic map (/exams/25fa/#item-2.3).
  useEffect(() => {
    if (!mounted) return;
    const fromHash = () => {
      const m = location.hash.match(/^#item-(.+)$/);
      if (!m) return;
      document.querySelectorAll('.item.is-target').forEach((e) => e.classList.remove('is-target'));
      const el = document.getElementById(`item-${decodeURIComponent(m[1])}`);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        el.classList.add('is-target');
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [mounted]);

  const used = now == null ? 0 : elapsed(run, now);
  const left = run.minutes * 60e3 - used;
  const total = items.reduce((s, it) => s + (Number(run.scores[it.id]) || 0), 0);
  const scored = items.filter((it) => run.scores[it.id] != null).length;
  const perPoint = run.minutes / exam.points;
  const allShown = items.every((it) => run.revealed[it.id]);

  function toggleClock() {
    update((r) =>
      r.runningSince
        ? { ...r, elapsedMs: elapsed(r, Date.now()), runningSince: null }
        : { ...r, runningSince: Date.now() },
    );
  }

  function finish() {
    const unscored = items.length - scored;
    if (unscored && !confirm(`${unscored} ${unscored > 1 ? 'items are' : 'item is'} unscored and will count as 0. Save anyway?`)) return;
    const attempts = read<Attempt[]>('attempts', []);
    attempts.push({
      id: Math.random().toString(36).slice(2, 10),
      examId: exam.id,
      finishedAt: Date.now(),
      score: total,
      total: exam.points,
      minutes: run.minutes,
      elapsedMs: elapsed(run, Date.now()),
      scores: run.scores,
    });
    write('attempts', attempts);
    remove(`run.${exam.id}`);
    router.push('/exams/');
  }

  const clockState = left < 0 ? 'is-over' : left < 5 * 60e3 ? 'is-low' : '';
  const startLabel = run.runningSince ? 'Pause' : used > 0 ? 'Resume' : 'Start the clock';

  return (
    <div className="page exam">
      <Link href="/exams/" className="back">All exams</Link>
      <header className="page-head">
        <div>
          <h1 className="h1">{exam.title}</h1>
          <p className="lede">
            {exam.points} points in {exam.minutes} minutes. Each item shows the time its points are worth.
            {exam.kind === 'mock' && exam.blurb ? ` ${exam.blurb}` : ''}
          </p>
          {exam.notes && <p className="fine">{exam.notes}</p>}
        </div>
        {exam.kind === 'past' && (exam.pdfs.blank || exam.pdfs.solutions) && (
          <p className="exam-pdfs">
            {exam.pdfs.blank && <a href={exam.pdfs.blank} target="_blank" rel="noreferrer">Exam PDF</a>}
            {exam.pdfs.solutions && <a href={exam.pdfs.solutions} target="_blank" rel="noreferrer">Solutions PDF</a>}
          </p>
        )}
      </header>

      <div className="timerbar" role="region" aria-label="Timer and score">
        <span className={`clock ${clockState}`} role="timer" aria-label="Time left">
          {mounted ? fmtClock(left) : fmtClock(exam.minutes * 60e3)}
        </span>
        <div className="timer-ctl">
          <button type="button" className={`btn ${run.runningSince ? '' : 'primary'}`} onClick={toggleClock}>{startLabel}</button>
          <label className="minutes">
            <input
              type="number"
              min={1}
              max={240}
              value={run.minutes}
              onChange={(e) => {
                const v = Math.max(1, Math.min(240, Number(e.target.value) || exam.minutes));
                update((r) => ({ ...r, minutes: v }));
              }}
            />
            <span>min</span>
          </label>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              if (used > 0 && !confirm('Reset the clock to the full time?')) return;
              update((r) => ({ ...r, elapsedMs: 0, runningSince: null }));
            }}
          >
            Reset clock
          </button>
        </div>
        <div className="timer-score">
          <span className="num">{total}<span className="dim">/{exam.points}</span></span>
          <span className="fine">{scored < items.length ? `${items.length - scored} unscored` : 'All scored'}</span>
        </div>
        <button type="button" className="btn primary" onClick={finish}>Save score</button>
      </div>
      {mounted && left <= 0 && (
        <p className="banner warn" role="status">Time&rsquo;s up. Finish the line you&rsquo;re on, then reveal the keys and score yourself.</p>
      )}

      <div className="exam-tools">
        <button
          type="button"
          className="link-btn"
          onClick={() => update((r) => ({ ...r, revealed: Object.fromEntries(items.map((it) => [it.id, !allShown])) }))}
        >
          {allShown ? 'Hide all keys' : 'Reveal all keys'}
        </button>
        <button
          type="button"
          className="link-btn danger"
          onClick={() => {
            if (confirm('Discard the clock, revealed keys and scores for this attempt?')) remove(`run.${exam.id}`);
          }}
        >
          Discard this attempt
        </button>
      </div>

      {exam.sections.map((s) => (
        <section key={s.id} className="exam-section" aria-labelledby={`sec-${s.id}`}>
          <div className="section-head">
            <h2 id={`sec-${s.id}`} className="h2">{s.id}. {s.title}</h2>
            <span className="fine num">{s.points} points</span>
          </div>
          {s.items.map((it) => (
            <ItemBlock
              key={it.id}
              exam={exam}
              it={it}
              minutes={Math.max(1, Math.round(it.points * perPoint))}
              shown={!!run.revealed[it.id]}
              score={run.scores[it.id]}
              onToggle={() => update((r) => ({ ...r, revealed: { ...r.revealed, [it.id]: !r.revealed[it.id] } }))}
              onScore={(v) =>
                update((r) => {
                  const scores = { ...r.scores };
                  if (v == null) delete scores[it.id];
                  else scores[it.id] = v;
                  return { ...r, scores };
                })
              }
            />
          ))}
        </section>
      ))}

      <div className="exam-end">
        <button type="button" className="btn primary" onClick={finish}>Save score</button>
      </div>
    </div>
  );
}

function ItemBlock({
  exam, it, minutes, shown, score, onToggle, onScore,
}: {
  exam: Exam;
  it: Item;
  minutes: number;
  shown: boolean;
  score: number | undefined;
  onToggle: () => void;
  onScore: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [coding, setCoding] = useState(false);
  const status = KEY_STATUS[it.keyStatus] ?? KEY_STATUS.none;
  return (
    <article className="item" id={`item-${it.id}`}>
      <div className="item-head">
        <span className="item-id">{it.id}</span>
        <span className="item-pts">{it.points} {it.points === 1 ? 'point' : 'points'}</span>
        <span className="item-budget">about {minutes} min</span>
      </div>
      <Prompt text={it.prompt} />
      {it.code && <CodeBlock code={it.code} lang={it.practice?.lang === 'java' ? 'java' : undefined} />}
      <div className="item-foot">
        <button type="button" className="btn small" aria-expanded={shown} aria-controls={`key-${exam.id}-${it.id}`} onClick={onToggle}>
          {shown ? 'Hide key' : 'Show key'}
        </button>
        {it.practice && (
          <button type="button" className="btn small" aria-expanded={coding} onClick={() => setCoding(!coding)}>
            {coding ? 'Close editor' : it.practice.mode === 'run' ? 'Run it' : 'Write and test it'}
          </button>
        )}
        <label className="score-in">
          <span>Score</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={it.points}
            step={0.5}
            value={draft ?? (score ?? '')}
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value === '') onScore(undefined);
              else onScore(Math.max(0, Math.min(it.points, Number(e.target.value))));
            }}
            onBlur={() => setDraft(null)}
          />
          <span className="dim">/ {it.points}</span>
        </label>
        {score != null && (
          <span className={`tag ${score >= it.points ? 'good' : score === 0 ? 'bad' : ''}`}>
            {score >= it.points ? 'Full marks' : score === 0 ? 'Missed' : 'Partial'}
          </span>
        )}
      </div>
      {coding && it.practice && (
        <div className="item-bench">
          <Workbench
            id={`exam.${exam.id}.${it.id}`}
            target={{ kind: 'practice', spec: it.practice }}
            tail={it.practice.lang === 'ocaml' && /tail recursi/i.test(it.practice.tests ?? '') ? EXAM_TAIL : undefined}
          />
        </div>
      )}
      {shown && (
        <div className="key" id={`key-${exam.id}-${it.id}`}>
          <span className={`tag ${status.tone}`}>{status.label}</span>
          {it.keyStatus === 'none' || !it.key ? (
            <p className="empty">No key recorded. Grade this one against the solutions PDF.</p>
          ) : (
            <CodeBlock code={it.key} wrap={!/\n/.test(it.key)} lang={/\n/.test(it.key) ? (it.practice?.lang === 'java' ? 'java' : undefined) : 'text'} />
          )}
          {it.notes && <p className="key-notes">{it.notes}</p>}
        </div>
      )}
    </article>
  );
}

/** Lay out "(a) ... (b) ... (c) ..." statements as a list when the letters run in order from (a). */
function Prompt({ text }: { text: string }) {
  const parts = text.split(/\s(?=\([a-h]\)\s)/);
  const intro = /^\([a-h]\)\s/.test(parts[0]) ? '' : parts.shift()!;
  const letters = parts.map((p) => p[1]);
  const inOrder = letters.length >= 2 && letters.every((l, i) => l === String.fromCharCode(97 + i));
  if (!inOrder) return <p className="item-prompt">{text}</p>;
  return (
    <div className="item-prompt">
      {intro && <p>{intro}</p>}
      <ol className="opts">
        {parts.map((p) => (
          <li key={p.slice(0, 3)}>
            <span className="opt-l">{p.slice(0, 3)}</span>
            <span>{p.slice(4)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
