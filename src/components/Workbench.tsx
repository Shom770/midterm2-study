'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeEditor } from '@/components/CodeEditor';
import { GuiPreview, parseFrame, type Frame } from '@/components/GuiPreview';
import {
  assembleJava, assembleOcaml, assembleProblem, dropWarnings, parseResults, shiftLines, userOutput,
  type Practice, type Results,
} from '@/lib/assemble';
import { DATA, type Problem } from '@/lib/data';
import { OcamlSession, runOcaml, warmOcaml } from '@/lib/runners/ocaml';
import { runJava, warmJava } from '@/lib/runners/java';
import { useMounted, useStored } from '@/lib/store';
import { checkTailCalls, type TailReport } from '@/lib/tailcheck';

// Large-input size for tail-recursion tests in the browser. The toplevel's
// stack is far bigger than the course grader's, so this has to be large for a
// non-tail-recursive answer to overflow.
const BROWSER_STRESS_N = 1_000_000;

export type Target = { kind: 'problem'; problem: Problem } | { kind: 'practice'; spec: Practice };

type Outcome =
  | { state: 'idle' }
  | { state: 'running'; note: string }
  | { state: 'error'; title: string; body: string }
  | { state: 'done'; results: Results | null; output: string; mode: 'tests' | 'run'; ms: number; tail: TailReport | null };

const javaWarm = { started: false };

/**
 * `tail`: also check statically that recursive calls are tail calls (the browser
 * runtime can't always tell by running). `only` limits it to these functions.
 */
export function Workbench({ id, target, onPassed, tail }: { id: string; target: Target; onPassed?: () => void; tail?: { only?: string[] } }) {
  const mounted = useMounted();
  const spec = target.kind === 'practice' ? target.spec : null;
  const lang = spec?.lang ?? 'ocaml';
  const starter = target.kind === 'problem' ? target.problem.starter : target.spec.starter;
  const mode = spec?.mode ?? 'tests';
  const [stored, setStored] = useStored<string | null>(`code.${id}`, null);
  // After "Load the answer key" or "Reset to starter": what was replaced, so it can be put back.
  const [replaced, setReplaced] = useState<{ prev: string; now: string; what: string } | null>(null);
  const replaceWith = (next: string, what: string) => {
    if (next === code) return;
    setReplaced({ prev: code, now: next, what });
    setStored(next === starter ? null : next);
  };
  const code = mounted && stored != null ? stored : starter;
  const [outcome, setOutcome] = useState<Outcome>({ state: 'idle' });
  const [frame, setFrame] = useState<Frame | null>(null);
  const session = useRef<OcamlSession | null>(null);

  useEffect(() => {
    if (lang === 'java') {
      if (!javaWarm.started) {
        javaWarm.started = true;
        warmJava().catch(() => (javaWarm.started = false));
      }
    } else warmOcaml();
    return () => session.current?.dispose();
  }, [lang]);

  const run = useCallback(async () => {
    const t0 = performance.now();
    setOutcome({ state: 'running', note: lang === 'java' ? 'Compiling with javac. The first run also starts Java, which takes a few seconds.' : 'Running' });
    try {
      if (lang === 'java' && spec) {
        const { program, offset } = assembleJava(spec, code);
        const r = await runJava(program);
        if (!r.compiled) return setOutcome({ state: 'error', title: r.timedOut ? 'Java is stuck' : 'Didn’t compile', body: shiftLines(r.compileOutput, offset) });
        if (r.timedOut) return setOutcome({ state: 'error', title: 'Stopped after 20 seconds', body: 'Is there an infinite loop? Reload the page to restart Java.' });
        return finish(r.stdout, Math.round(performance.now() - t0));
      }
      const { program, offset } =
        target.kind === 'problem'
          ? assembleProblem(target.problem, code, BROWSER_STRESS_N)
          : assembleOcaml(target.spec, code, DATA.practiceLibs, { stressN: BROWSER_STRESS_N });
      const r = await runOcaml(program);
      if (!r.compiled) return setOutcome({ state: 'error', title: 'Didn’t compile', body: shiftLines(r.diagnostics || r.stderr, offset) });
      if (r.timedOut) return setOutcome({ state: 'error', title: 'Stopped after 20 seconds', body: 'Is there an infinite loop?' });
      const errs = dropWarnings(r.stderr);
      finish(r.stdout + (errs ? `\n${shiftLines(errs, offset)}` : ''), Math.round(performance.now() - t0));
      if (lang === 'gui' && spec?.preview) startPreview(spec);
    } catch (e) {
      setOutcome({ state: 'error', title: 'Couldn’t run', body: (e as Error).message });
    }

    function finish(stdout: string, ms: number) {
      const results = mode === 'tests' ? parseResults(stdout) : null;
      const tailReport = tail && lang !== 'java' ? checkTailCalls(code, tail.only) : null;
      setOutcome({ state: 'done', results, output: userOutput(stdout), mode, ms, tail: tailReport });
      const testsOk = results && results.summary && results.total > 0 && results.passed === results.total;
      if (testsOk && tailReport?.status !== 'fail') onPassed?.();
    }
    // `code` is the only input that changes between runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, mode, onPassed, tail]);

  async function startPreview(s: Practice) {
    session.current?.dispose();
    const sess = new OcamlSession();
    session.current = sess;
    const { program } = assembleOcaml(s, code, DATA.practiceLibs, { tests: false });
    const r = await sess.run(`${program}\n;; Harness.show (${s.preview})\n`);
    setFrame(r.compiled ? parseFrame(r.stdout) : null);
  }

  async function sendEvent(kind: string, x: number, y: number) {
    const sess = session.current;
    if (!sess) return;
    const k = JSON.stringify(kind); // a JSON string of plain ASCII is a valid OCaml string literal
    const r = await sess.run(`;; Harness.event ${k} ${Math.round(x)} ${Math.round(y)}\n`, 5000);
    const f = parseFrame(r.stdout);
    if (f) setFrame(f);
  }

  const solution = target.kind === 'practice' ? target.spec.solution : undefined;
  const busy = outcome.state === 'running';

  return (
    <div className="bench">
      <CodeEditor
        value={code}
        onChange={(v) => {
          setStored(v);
          if (replaced && v !== replaced.now) setReplaced(null);
        }}
        lang={lang === 'java' ? 'java' : 'ocaml'}
        onRun={run}
        label="Code editor"
      />
      <div className="bench-bar">
        <button type="button" className="btn primary" onClick={run} disabled={busy}>
          {busy ? 'Running…' : mode === 'run' ? 'Run' : 'Run tests'} <kbd>⌘↵</kbd>
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => replaceWith(starter, 'the starter code')}
        >
          Reset to starter
        </button>
        {solution && (
          <button
            type="button"
            className="link-btn"
            onClick={() => replaceWith(solution, 'the answer key')}
          >
            Load the answer key
          </button>
        )}
        {replaced && (
          <span className="bench-undo" role="status">
            Showing {replaced.what}.{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStored(replaced.prev === starter ? null : replaced.prev);
                setReplaced(null);
              }}
            >
              Put my code back
            </button>
          </span>
        )}
        <span className="bench-lang">{lang === 'java' ? 'Java 21' : lang === 'gui' ? 'OCaml + your HW5 GUI library' : 'OCaml'}</span>
      </div>

      <Output outcome={outcome} />

      {lang === 'gui' && spec?.preview && (
        <GuiPreview frame={frame} onEvent={sendEvent} hint={frame ? null : 'Run the code to see the widget. Then click, drag or type on it.'} />
      )}
    </div>
  );
}

function Output({ outcome }: { outcome: Outcome }) {
  if (outcome.state === 'idle') return null;
  if (outcome.state === 'running') return <p className="bench-status" role="status">{outcome.note}…</p>;
  if (outcome.state === 'error') {
    return (
      <div className="bench-out is-bad" role="status">
        <p className="bench-title">{outcome.title}</p>
        {outcome.body && <pre className="code is-wrap">{outcome.body.trim()}</pre>}
      </div>
    );
  }
  const { results, output, mode, ms, tail } = outcome;
  if (mode === 'run') {
    return (
      <div className="bench-out" role="status">
        <p className="bench-title">Output <span className="fine">{ms} ms</span></p>
        <pre className="code is-wrap">{output || '(nothing printed)'}</pre>
      </div>
    );
  }
  const r = results!;
  const crashed = !r.summary;
  const tailFailed = tail?.status === 'fail';
  const allOk = !crashed && r.total > 0 && r.passed === r.total && !tailFailed;
  return (
    <div className={`bench-out ${allOk ? 'is-good' : 'is-bad'}`} role="status">
      <p className="bench-title">
        {crashed
          ? 'Your code crashed before the tests finished'
          : allOk
            ? `All ${r.total} tests pass${tail?.status === 'ok' ? ', and it’s tail recursive' : ''}`
            : r.passed === r.total && tailFailed
              ? `All ${r.total} tests pass, but it isn’t tail recursive`
              : `${r.passed} of ${r.total} tests pass`}
        <span className="fine"> {ms} ms</span>
      </p>
      {crashed && (
        <p className="fine">
          This usually means the stack overflowed: a recursive call on a long list that isn&rsquo;t a tail call. It can also be an uncaught exception at the top level.
        </p>
      )}
      {r.tests.length > 0 && (
        <ul className="tests">
          {r.tests.map((t, i) => (
            <li key={i} className={t.ok ? 'ok' : 'no'}>
              <span className="mark" aria-label={t.ok ? 'passed' : 'failed'}>{t.ok ? '✓' : '✕'}</span>
              <span>{t.name}{t.detail && <span className="dim">: {t.detail}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {tail && <TailResult report={tail} />}
      {output && (
        <>
          <p className="fine">Printed by your code:</p>
          <pre className="code is-wrap">{output}</pre>
        </>
      )}
    </div>
  );
}

function TailResult({ report }: { report: TailReport }) {
  if (report.status === 'unknown') {
    return <p className="fine">The tail-call check couldn&rsquo;t read this code ({report.why}), so only the large-input test checks tail recursion.</p>;
  }
  if (report.status === 'ok') {
    return (
      <ul className="tests">
        <li className="ok">
          <span className="mark" aria-label="passed">✓</span>
          <span>Tail-call check: every recursive call in {report.checked.map((n, i) => <span key={n}>{i ? ', ' : ''}<code>{n}</code></span>)} is a tail call</span>
        </li>
      </ul>
    );
  }
  return (
    <ul className="tests">
      {report.issues.map((i) => (
        <li key={`${i.line}-${i.call}`} className="no">
          <span className="mark" aria-label="failed">✕</span>
          <span>Tail-call check, line {i.line}: <code>{i.call}</code> isn&rsquo;t a tail call, because {i.reason}.</span>
        </li>
      ))}
    </ul>
  );
}
