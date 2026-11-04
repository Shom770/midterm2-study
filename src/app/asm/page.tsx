'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AsmDiagram } from '@/components/AsmDiagram';
import { CodeBlock } from '@/components/CodeBlock';
import type { AsmState, Lesson, Quiz } from '@/lib/asm';
import { DATA } from '@/lib/data';
import { useMounted, useStored } from '@/lib/store';

const ASM = DATA.asm;
const GROUPS = [...new Set([...ASM.lessons.map((l) => l.group), ...ASM.quizzes.map((q) => q.group)])];
const EMPTY: AsmState = { stack: [], heap: [] };

type Progress = {
  lessons: Record<string, { seen: number; done?: boolean; asks?: Record<string, boolean> }>;
  quizzes: Record<string, boolean>;
};
const NO_PROGRESS: Progress = { lessons: {}, quizzes: {} };

type Tab = 'lessons' | 'quiz' | 'rules';

/** `code` spans in rule text written with backticks. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((s, i) => (s.startsWith('`') && s.endsWith('`') ? <code key={i}>{s.slice(1, -1)}</code> : s))}
    </>
  );
}

export default function AsmPage() {
  const mounted = useMounted();
  const [stored, setProgress] = useStored<Progress>('asm', NO_PROGRESS);
  const progress = mounted ? { ...NO_PROGRESS, ...stored } : NO_PROGRESS;
  const [tab, setTab] = useState<Tab>('lessons');
  const [lessonId, setLessonId] = useState(ASM.lessons[0]?.id ?? '');

  // #rules, #quiz, or #<lesson id>
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h === 'rules' || h === 'quiz') setTab(h);
      else if (ASM.lessons.some((l) => l.id === h)) { setTab('lessons'); setLessonId(h); }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const go = (t: Tab, id?: string) => {
    setTab(t);
    if (id) setLessonId(id);
    history.replaceState(null, '', `#${id ?? t}`);
  };

  const lessonsDone = Object.values(progress.lessons).filter((l) => l.done).length;
  const quizRight = Object.values(progress.quizzes).filter(Boolean).length;

  return (
    <div className="page asm-page">
      <header className="page-head">
        <div>
          <h1 className="h1">ASM practice</h1>
          <p className="lede">Step through programs and watch the stack and heap change, answer &ldquo;what happens next&rdquo; before each reveal, then test yourself on pictures like the ones on the exam.</p>
        </div>
        <div className="seg seg-tabs" role="tablist" aria-label="ASM practice">
          {([
            ['lessons', `Lessons ${lessonsDone}/${ASM.lessons.length}`],
            ['quiz', `Quiz ${quizRight}/${ASM.quizzes.length}`],
            ['rules', 'Rules'],
          ] as const).map(([t, label]) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} aria-pressed={tab === t} onClick={() => go(t)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {ASM.lessons.length === 0 ? (
        <p className="empty">No ASM content yet. Add data/asm.json and run npm run data.</p>
      ) : tab === 'lessons' ? (
        <Lessons lessonId={lessonId} onPick={(id) => go('lessons', id)} progress={progress} setProgress={setProgress} />
      ) : tab === 'quiz' ? (
        <Quizzes progress={progress} setProgress={setProgress} />
      ) : (
        <Rules />
      )}
    </div>
  );
}

// ---------- lessons ----------

function Lessons({ lessonId, onPick, progress, setProgress }: {
  lessonId: string;
  onPick: (id: string) => void;
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const lesson = ASM.lessons.find((l) => l.id === lessonId) ?? ASM.lessons[0];
  return (
    <div className="asm-lessons">
      <nav className="lesson-list" aria-label="Lessons">
        {GROUPS.filter((g) => ASM.lessons.some((l) => l.group === g)).map((g) => (
          <div key={g} className="lesson-group">
            <p className="lesson-group-title">{g}</p>
            <ul>
              {ASM.lessons.filter((l) => l.group === g).map((l) => {
                const pr = progress.lessons[l.id];
                return (
                  <li key={l.id}>
                    <button type="button" aria-current={l.id === lesson.id ? 'true' : undefined} onClick={() => onPick(l.id)}>
                      <span className={`lesson-state ${pr?.done ? 'is-done' : pr ? 'is-started' : ''}`} aria-hidden />
                      <span>{l.title}</span>
                      {l.lang === 'java' && <span className="tn-meta">Java</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <Player key={lesson.id} lesson={lesson} progress={progress} setProgress={setProgress} onNext={() => {
        const i = ASM.lessons.findIndex((l) => l.id === lesson.id);
        if (i + 1 < ASM.lessons.length) onPick(ASM.lessons[i + 1].id);
      }} />
    </div>
  );
}

function Player({ lesson, progress, setProgress, onNext }: {
  lesson: Lesson;
  progress: Progress;
  setProgress: (fn: (p: Progress) => Progress) => void;
  onNext: () => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const step = lesson.steps[i];
  const prev = i > 0 ? lesson.steps[i - 1] : EMPTY;
  const asking = !!step.ask && picked[i] === undefined;
  const shown: AsmState = asking ? prev : step;
  const last = i === lesson.steps.length - 1;
  const lines = step.line == null ? [] : Array.isArray(step.line) ? range(step.line[0], step.line[1]) : [step.line];

  const record = useCallback(
    (fn: (l: Progress['lessons'][string]) => Progress['lessons'][string]) =>
      setProgress((p) => ({ ...NO_PROGRESS, ...p, lessons: { ...p.lessons, [lesson.id]: fn(p.lessons?.[lesson.id] ?? { seen: 0 }) } })),
    [lesson.id, setProgress],
  );

  const advance = useCallback(() => {
    if (asking) return;
    if (last) {
      record((l) => ({ ...l, seen: lesson.steps.length, done: true }));
      return;
    }
    setI((n) => n + 1);
    record((l) => ({ ...l, seen: Math.max(l.seen, i + 2) }));
  }, [asking, last, record, lesson.steps.length, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); advance(); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); setI(i - 1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [advance, i]);

  const answer = (c: number) => {
    setPicked((p) => ({ ...p, [i]: c }));
    record((l) => ({ ...l, asks: { ...(l.asks ?? {}), [i]: c === step.ask!.answer } }));
  };
  const done = progress.lessons[lesson.id]?.done;

  return (
    <article className="player" aria-labelledby="lesson-title">
      <header className="player-head">
        <div>
          <h2 id="lesson-title" className="h2 player-title">{lesson.title}</h2>
          <p className="fine">{lesson.summary}</p>
        </div>
        <ol className="steps-dots" aria-label={`Step ${i + 1} of ${lesson.steps.length}`}>
          {lesson.steps.map((s, k) => (
            <li key={k}>
              <button
                type="button"
                className={`${k === i ? 'is-now' : ''} ${k < i ? 'is-past' : ''} ${s.ask ? 'has-ask' : ''}`}
                aria-label={`Step ${k + 1}${s.ask ? ' (question)' : ''}`}
                aria-current={k === i ? 'step' : undefined}
                disabled={k > i}
                onClick={() => setI(k)}
              />
            </li>
          ))}
        </ol>
      </header>

      <div className="player-body">
        <div className="player-code">
          <p className="pane-title">{lesson.lang === 'java' ? 'Java' : 'OCaml'}</p>
          <CodeBlock code={lesson.code} lang={lesson.lang} lines={asking ? [] : lines} numbered />
          {step.workspace && !asking && (
            <p className="workspace"><span className="fine">Workspace</span> <code>{step.workspace}</code></p>
          )}
        </div>
        <div className="player-diagram">
          <p className="pane-title">{asking ? 'Before this step' : `After step ${i + 1}`}</p>
          <div className="diagram-wrap">
            <AsmDiagram state={shown} prev={asking ? undefined : prev} label={`Stack and heap ${asking ? 'before' : 'after'} step ${i + 1}`} />
          </div>
        </div>
      </div>

      {step.ask && (
        <div className={`ask ${asking ? '' : picked[i] === step.ask.answer ? 'is-right' : 'is-wrong'}`} role="group" aria-label="Predict first">
          <p className="ask-prompt"><span className="ask-tag">Predict</span> {step.ask.prompt}</p>
          <div className="ask-choices">
            {step.ask.choices.map((c, k) => (
              <button
                key={k}
                type="button"
                className={`choice ${!asking && k === step.ask!.answer ? 'is-answer' : ''} ${!asking && k === picked[i] && k !== step.ask!.answer ? 'is-picked-wrong' : ''}`}
                disabled={!asking}
                onClick={() => answer(k)}
              >
                <code>{c}</code>
              </button>
            ))}
          </div>
          {!asking && (
            <p className="ask-explain">
              <strong>{picked[i] === step.ask.answer ? 'Right.' : 'Not quite.'}</strong> {step.ask.explain}
            </p>
          )}
        </div>
      )}

      {!asking && <p className="note">{step.note}</p>}

      <div className="player-bar">
        <button type="button" className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {last ? (
          done ? (
            <button type="button" className="btn primary" onClick={onNext}>Next lesson</button>
          ) : (
            <button type="button" className="btn primary" disabled={asking} onClick={advance}>Finish lesson</button>
          )
        ) : (
          <button type="button" className="btn primary" disabled={asking} onClick={advance}>
            {asking ? 'Answer to continue' : 'Next step'}
          </button>
        )}
        <span className="fine">Step {i + 1} of {lesson.steps.length}. Arrow keys work too.</span>
      </div>
    </article>
  );
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

// ---------- quizzes ----------

function Quizzes({ progress, setProgress }: { progress: Progress; setProgress: (fn: (p: Progress) => Progress) => void }) {
  const [group, setGroup] = useState('');
  const list = useMemo(() => ASM.quizzes.filter((q) => !group || q.group === group), [group]);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const q = list[Math.min(idx, list.length - 1)];

  const choose = (k: number) => {
    if (pick !== null) return;
    setPick(k);
    setProgress((p) => ({ ...NO_PROGRESS, ...p, quizzes: { ...p.quizzes, [q.id]: k === q.answer } }));
  };
  const next = () => {
    setPick(null);
    setIdx((n) => (n + 1) % list.length);
  };

  return (
    <div className="quiz">
      <div className="quiz-tools">
        <label className="select">
          <span className="sr-only">Group</span>
          <select value={group} onChange={(e) => { setGroup(e.target.value); setIdx(0); setPick(null); }}>
            <option value="">All groups ({ASM.quizzes.length})</option>
            {GROUPS.filter((g) => ASM.quizzes.some((x) => x.group === g)).map((g) => (
              <option key={g} value={g}>{g} ({ASM.quizzes.filter((x) => x.group === g).length})</option>
            ))}
          </select>
        </label>
        <span className="fine">Question {Math.min(idx, list.length - 1) + 1} of {list.length}</span>
        <span className="fine">
          {Object.values(progress.quizzes).filter(Boolean).length} of {ASM.quizzes.length} answered right at least once
        </span>
      </div>
      {q && <QuizCard key={q.id} q={q} pick={pick} onPick={choose} onNext={next} />}
    </div>
  );
}

function QuizCard({ q, pick, onPick, onNext }: { q: Quiz; pick: number | null; onPick: (k: number) => void; onNext: () => void }) {
  const diagramChoices = q.choices.some((c) => c.state);
  const lang = q.group === 'Java ASM' ? 'java' : 'ocaml';
  return (
    <article className={`quiz-card ${pick === null ? '' : pick === q.answer ? 'is-right' : 'is-wrong'}`}>
      <p className="quiz-group fine">{q.group}</p>
      <h2 className="h2 quiz-prompt">{q.prompt}</h2>
      {q.code && <CodeBlock code={q.code} lang={lang} numbered />}
      {q.picture && (
        <div className="diagram-wrap">
          <AsmDiagram state={q.picture} label="The picture to match" />
        </div>
      )}
      <div className={diagramChoices ? 'quiz-choices is-diagrams' : 'quiz-choices'}>
        {q.choices.map((c, k) => (
          <button
            key={k}
            type="button"
            className={`choice ${pick !== null && k === q.answer ? 'is-answer' : ''} ${pick === k && k !== q.answer ? 'is-picked-wrong' : ''}`}
            disabled={pick !== null}
            onClick={() => onPick(k)}
          >
            <span className="choice-key">{String.fromCharCode(65 + k)}</span>
            {c.state ? (
              <AsmDiagram state={c.state} compact label={`Choice ${String.fromCharCode(65 + k)}`} />
            ) : null}
            {c.label && (/\n|let |=|\{|;/.test(c.label) ? <CodeBlock code={c.label} lang={lang} className="choice-code" /> : <span>{c.label}</span>)}
          </button>
        ))}
      </div>
      {pick !== null && (
        <div className="quiz-after">
          <p className="ask-explain"><strong>{pick === q.answer ? 'Right.' : `Not quite: the answer is ${String.fromCharCode(65 + q.answer)}.`}</strong> {q.explain}</p>
          <button type="button" className="btn primary" onClick={onNext}>Next question</button>
        </div>
      )}
    </article>
  );
}

// ---------- rules ----------

function Rules() {
  return (
    <div className="rules-sheet">
      {ASM.rules.map((r) => (
        <section key={r.title} className="rule-card">
          <h2 className="h3">{r.title}</h2>
          <ul className="ticks">
            {r.points.map((p) => <li key={p}><Inline text={p} /></li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}
