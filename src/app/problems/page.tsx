'use client';
import { useEffect, useMemo, useState } from 'react';
import { CodeBlock } from '@/components/CodeBlock';
import { Workbench } from '@/components/Workbench';
import { DATA, type Drill, type Problem } from '@/lib/data';
import { inlineCode, parseStatement, type Statement } from '@/lib/statement';
import { useMounted, useStored } from '@/lib/store';

const byId = Object.fromEntries(DATA.problems.map((p) => [p.id, p]));
const LEVEL = ['', 'Warm-up', 'Standard', 'Harder'];

function problemGroups() {
  const out: { title: string; sub: string; ids: number[] }[] = [];
  const placed = new Set<number>();
  for (const t of DATA.topics.filter((t) => t.problems.length)) {
    // The course's "tail recursion" list problems don't actually require it.
    const isTr = t.id === 'tailrec';
    out.push({
      title: isTr ? 'List warm-ups' : t.title,
      sub: isTr ? 'Plain recursion is fine here. For tail recursion, use the drills above.' : t.guide,
      ids: t.problems,
    });
    t.problems.forEach((p) => placed.add(p));
  }
  const other = DATA.problems.filter((p) => !placed.has(p.id) && !p.midterm1).map((p) => p.id);
  if (other.length) out.push({ title: 'Other list practice', sub: 'Homework 1 style', ids: other });
  out.push({
    title: 'Midterm 1 material',
    sub: 'Trees, DNA and helices, sets, higher-order functions. Not on Midterm 2.',
    ids: DATA.problems.filter((p) => p.midterm1).map((p) => p.id),
  });
  return out;
}
const GROUPS = problemGroups();
const DRILL_GROUPS = [...new Set(DATA.drills.map((d) => d.group))];
const DRILL_TAIL = {};

/** Open rows are addressed as #q46 (problems) or #tr-<id> (drills). */
function useHashOpen(): [string | null, (k: string | null) => void] {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const fromHash = () => {
      const k = location.hash.slice(1);
      if (!/^(q\d+|tr-[\w-]+)$/.test(k)) return;
      setOpen(k);
      requestAnimationFrame(() => document.getElementById(k)?.scrollIntoView({ block: 'start' }));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  return [open, setOpen];
}

export default function ProblemsPage() {
  const mounted = useMounted();
  const [storedSolved, setSolved] = useStored<Record<string, boolean>>('solved', {});
  const [storedDrills, setDrillsDone] = useStored<Record<string, boolean>>('drills', {});
  const solved = mounted ? storedSolved : {};
  const drillsDone = mounted ? storedDrills : {};
  const [open, setOpen] = useHashOpen();
  const toggle = (k: string) => setOpen(open === k ? null : k);
  const mark = (set: typeof setSolved, k: string | number, v: boolean) =>
    set((prev) => {
      const next = { ...prev };
      if (v) next[k] = true;
      else delete next[k];
      return next;
    });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h1">Problems</h1>
          <p className="lede">Open a problem, read the instructions on the left, write your answer on the right and run the tests. Everything runs in your browser.</p>
        </div>
        <nav className="jump" aria-label="Sections on this page">
          {DATA.drills.length > 0 && (
            <a href="#drills">Tail-recursion drills <span className="num">{Object.keys(drillsDone).length}/{DATA.drills.length}</span></a>
          )}
          <a href="#practice">Practice problems <span className="num">{Object.keys(solved).length}/{DATA.problems.length}</span></a>
        </nav>
      </header>

      {DATA.drills.length > 0 && (
        <section id="drills" className="part">
          <div className="part-head">
            <h2 className="h1 part-title">Tail-recursion drills</h2>
            <p className="lede">Each one has to be tail recursive. A hidden test runs your answer on a million elements, and a version that isn&rsquo;t tail recursive overflows the stack and fails it.</p>
          </div>
          {DRILL_GROUPS.map((g) => (
            <section key={g} className="block">
              <div className="block-head"><h3 className="h2">{g}</h3></div>
              <ul className="probs">
                {DATA.drills.filter((d) => d.group === g).map((d) => (
                  <li key={d.id} id={`tr-${d.id}`} className={`prob ${drillsDone[d.id] ? 'is-solved' : ''} ${open === `tr-${d.id}` ? 'is-open' : ''}`}>
                    <button type="button" className="prob-head" aria-expanded={open === `tr-${d.id}`} onClick={() => toggle(`tr-${d.id}`)}>
                      <span className={`prob-level lv-${d.level}`}>{LEVEL[d.level]}</span>
                      <span className="prob-title">{d.title}</span>
                      <span className="prob-file">{d.summary}</span>
                      {drillsDone[d.id] && <span className="tag good">Passed</span>}
                    </button>
                    {open === `tr-${d.id}` && (
                      <div className="prob-open">
                        <DrillBrief d={d} />
                        <div className="bench-col">
                          <h4 className="pane-title">Your code</h4>
                          <Workbench id={`drill.${d.id}`} target={{ kind: 'practice', spec: d.practice }} tail={DRILL_TAIL} onPassed={() => mark(setDrillsDone, d.id, true)} />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      )}

      <section id="practice" className="part">
        <div className="part-head">
          <h2 className="h1 part-title">Practice problems</h2>
          <p className="lede">The 46 problems from the course&rsquo;s practice exam, grouped by topic. Passing every test marks one solved.</p>
        </div>
        {GROUPS.map((g) => (
          <section key={g.title} className="block">
            <div className="block-head">
              <h3 className="h2">{g.title}</h3>
              <p className="fine">{g.sub}</p>
            </div>
            <ul className="probs">
              {g.ids.map((id) => byId[id]).filter(Boolean).map((p) => (
                <li key={`${g.title}-${p.id}`} id={`q${p.id}`} className={`prob ${solved[p.id] ? 'is-solved' : ''} ${open === `q${p.id}` ? 'is-open' : ''}`}>
                  <button type="button" className="prob-head" aria-expanded={open === `q${p.id}`} onClick={() => toggle(`q${p.id}`)}>
                    <span className="prob-id num">Q{p.id}</span>
                    <span className="prob-title">{p.title}</span>
                    <span className="prob-file">{p.filename}</span>
                    {solved[p.id] && <span className="tag good">Solved</span>}
                  </button>
                  {open === `q${p.id}` && (
                    <ProblemBody p={p} solved={!!solved[p.id]} onSolved={(v) => mark(setSolved, p.id, v)} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </div>
  );
}

function ProblemBody({ p, solved, onSolved }: { p: Problem; solved: boolean; onSolved: (v: boolean) => void }) {
  const st = useMemo(() => parseStatement(p.text, p.starter), [p]);
  const tail = useMemo(() => (st.rules.some((r) => /tail recursive/i.test(r)) ? { only: st.names } : undefined), [st]);
  return (
    <div className="prob-open">
      <ProblemBrief st={st} />
      <div className="bench-col">
        <h4 className="pane-title">Your code{p.filename && <span className="pane-file">{p.filename}</span>}</h4>
        <Workbench id={`problem.${p.id}`} target={{ kind: 'problem', problem: p }} tail={tail} onPassed={() => onSolved(true)} />
        <details className="local">
          <summary>Run it locally instead</summary>
          <p className="fine">The browser&rsquo;s stack is bigger than the course grader&rsquo;s. For the strictest tail-recursion check, edit <code>problems/{p.folder}/{p.filename}</code> and run:</p>
          <CopyCommand cmd={`./problems/${p.folder}/run.sh`} />
          <label className="check">
            <input type="checkbox" checked={solved} onChange={(e) => onSolved(e.target.checked)} />
            <span>Mark solved</span>
          </label>
        </details>
      </div>
    </div>
  );
}

function ProblemBrief({ st }: { st: Statement }) {
  return (
    <aside className="brief" aria-label="Instructions">
      <h4 className="pane-title">Instructions</h4>
      {(st.source || st.file) && (
        <p className="brief-meta">
          {st.source && <span>{st.source}</span>}
          {st.file && <span>File <code>{st.file}</code></span>}
        </p>
      )}
      {st.blocks.map((b, i) =>
        b.kind === 'code' ? (
          <CodeBlock key={i} code={b.text} wrap className="brief-code" />
        ) : (
          <p key={i} className="brief-p">
            {inlineCode(b.text, st.names).map((s, j) => (s.code ? <code key={j}>{s.text}</code> : s.text))}
          </p>
        ),
      )}
      <Rules rules={st.rules} />
    </aside>
  );
}

function DrillBrief({ d }: { d: Drill }) {
  return (
    <aside className="brief" aria-label="Instructions">
      <h4 className="pane-title">Instructions</h4>
      <p className="brief-p">{inlineCode(d.summary, [d.title]).map((s, j) => (s.code ? <code key={j}>{s.text}</code> : s.text))}</p>
      <p className="brief-label">Signature</p>
      <CodeBlock code={d.signature} wrap className="brief-code" />
      {d.examples.length > 0 && (
        <>
          <p className="brief-label">Examples</p>
          <CodeBlock code={d.examples.join('\n')} wrap className="brief-code" />
        </>
      )}
      <Rules rules={d.rules} />
      {d.hint && (
        <details className="hint">
          <summary>Hint</summary>
          <p>{d.hint}</p>
        </details>
      )}
    </aside>
  );
}

function Rules({ rules }: { rules: string[] }) {
  if (!rules.length) return null;
  return (
    <ul className="rules" aria-label="Rules">
      {rules.map((r) => (
        <li key={r}><span className="rule-mark" aria-hidden>!</span><span>{r}</span></li>
      ))}
    </ul>
  );
}

function CopyCommand({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="cmd">
      <code>{cmd}</code>
      <button
        type="button"
        className="btn small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
