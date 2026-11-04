// Checks every practice spec in data/practice/*.json with native ocamlc/javac:
//   - the solution must compile and pass every test ('tests' mode) or run cleanly ('run' mode)
//   - the starter must NOT pass every test (otherwise the tests check nothing)
//   - GUI specs with a preview must build the preview widget
// Usage: node scripts/check-practice.ts [examId/itemId ...]
// Programs are assembled by src/lib/assemble.ts, the same code the browser uses.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleJava, assembleOcaml, parseResults, shiftLines, type Libs, type Practice } from '../src/lib/assemble.ts';
import { checkTailCalls } from '../src/lib/tailcheck.ts';

const ROOT = join(import.meta.dirname, '..');
const lib = (f: string) => readFileSync(join(ROOT, 'practice', 'lib', f), 'utf8');
const libs: Libs = { assert: lib('assert.ml'), g: lib('g.ml'), gctx: lib('gctx.ml'), widget: lib('widget.ml'), harness: lib('harness.ml') };

const specs: Record<string, Practice> = {};
for (const f of readdirSync(join(ROOT, 'data', 'practice')).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(join(ROOT, 'data', 'practice', f), 'utf8')) as Record<string, Practice>;
  for (const [k, v] of Object.entries(data)) {
    if (specs[k]) throw new Error(`${k} is defined twice (second time in ${f})`);
    specs[k] = v;
  }
}
// Tail-recursion drills (data/drills.json) are checked the same way, keyed drill/<id>.
const drillsPath = join(ROOT, 'data', 'drills.json');
try {
  const drills = JSON.parse(readFileSync(drillsPath, 'utf8')) as { id: string; practice: Practice }[];
  for (const d of drills) {
    if (specs[`drill/${d.id}`]) throw new Error(`drill ${d.id} is defined twice`);
    specs[`drill/${d.id}`] = d.practice;
  }
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
}
const only = process.argv.slice(2);
const keys = Object.keys(specs).filter((k) => !only.length || only.includes(k)).sort();

type Run = { compiled: boolean; stdout: string; errors: string; timedOut: boolean };

function run(cmd: string, args: string[], cwd: string, env: Record<string, string> = {}): { ok: boolean; out: string; timedOut: boolean } {
  try {
    const out = execFileSync(cmd, args, { cwd, env: { ...process.env, ...env }, timeout: 20000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out, timedOut: false };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; signal?: string };
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}`, timedOut: err.signal === 'SIGTERM' };
  }
}

function runProgram(spec: Practice, code: string, opts: { preview?: boolean } = {}): Run {
  const dir = mkdtempSync(join(tmpdir(), 'practice-'));
  if (spec.lang === 'java') {
    const { program, offset } = assembleJava(spec, code);
    writeFileSync(join(dir, 'Main.java'), program);
    const c = run('javac', ['-nowarn', 'Main.java'], dir);
    if (!c.ok) return { compiled: false, stdout: '', errors: shiftLines(c.out, offset), timedOut: false };
    const r = run('java', ['-Xss1m', 'Main'], dir);
    return { compiled: true, stdout: r.out, errors: r.ok ? '' : r.out, timedOut: r.timedOut };
  }
  let { program, offset } = assembleOcaml(spec, code, libs, { stressN: 100000 });
  if (opts.preview && spec.preview) program += `\n;; Harness.show (${spec.preview})\n`;
  writeFileSync(join(dir, 'main.ml'), program);
  const c = run('ocamlc', ['-w', '-a', '-o', 'main.byte', 'main.ml'], dir);
  if (!c.ok) return { compiled: false, stdout: '', errors: shiftLines(c.out, offset), timedOut: false };
  // A small stack, like the course grader, so non-tail-recursive code fails the large tests.
  const r = run('./main.byte', [], dir, { OCAMLRUNPARAM: 'l=2000' });
  return { compiled: true, stdout: r.out, errors: r.ok ? '' : r.out, timedOut: r.timedOut };
}

let bad = 0;
for (const k of keys) {
  const s = specs[k];
  const problems: string[] = [];
  if (!['ocaml', 'java', 'gui'].includes(s.lang)) problems.push(`bad lang ${s.lang}`);
  if (!s.starter) problems.push('no starter');
  const mode = s.mode ?? 'tests';
  if (mode === 'tests' && !s.tests) problems.push('tests mode but no tests');
  if (mode === 'tests' && s.lang === 'java' && !/static\s+void\s+tests\s*\(/.test(s.tests ?? '')) problems.push('java tests must define static void tests()');

  const sol = runProgram(s, s.solution ?? s.starter);
  if (!sol.compiled) problems.push(`solution does not compile:\n${sol.errors.trim()}`);
  else if (sol.timedOut) problems.push('solution timed out');
  else if (mode === 'tests') {
    const r = parseResults(sol.stdout);
    if (!r.summary || r.total === 0 || r.passed !== r.total) {
      problems.push(`solution: ${r.passed}/${r.total} passed${r.summary ? '' : ' (no SUMMARY: crashed?)'}\n${sol.stdout.split('\n').filter((l) => l.startsWith('FAIL')).join('\n')}${sol.errors}`);
    }
    // The static tail-call check (used in the browser) must accept the key and reject nonTail.
    if (k.startsWith('drill/') || (s.lang === 'ocaml' && /tail recursi/i.test(s.tests ?? ''))) {
      const tc = checkTailCalls(s.solution ?? s.starter);
      if (tc.status === 'fail') problems.push(`static tail-call check rejects the solution: ${tc.issues.map((i) => `line ${i.line} ${i.call}: ${i.reason}`).join('; ')}`);
      if (k.startsWith('drill/') && tc.status === 'unknown') problems.push(`static tail-call check can't read the solution: ${tc.why}`);
      if (s.nonTail) {
        const tn = checkTailCalls(s.nonTail);
        if (tn.status !== 'fail') problems.push(`static tail-call check does not catch nonTail (${tn.status})`);
      }
    }
    if (s.nonTail) {
      const nt = runProgram(s, s.nonTail);
      const rn = nt.compiled ? parseResults(nt.stdout) : null;
      if (!rn) problems.push(`nonTail does not compile:\n${nt.errors.trim()}`);
      else {
        const failed = rn.tests.filter((t) => !t.ok);
        const trFailed = failed.filter((t) => /tail recursi/i.test(t.name));
        if (!trFailed.length) problems.push('nonTail passes the tail-recursion test: the test does not catch non-tail-recursive code');
        const other = failed.filter((t) => !/tail recursi/i.test(t.name));
        if (other.length) problems.push(`nonTail should only fail tail-recursion tests, but also failed: ${other.map((t) => t.name).join('; ')}`);
        if (!rn.summary) problems.push('nonTail crashed instead of failing the tail-recursion test cleanly (wrap the large input in run_test)');
      }
    }
    const st = runProgram(s, s.starter);
    const rs = st.compiled ? parseResults(st.stdout) : null;
    if (rs && rs.summary && rs.total > 0 && rs.passed === rs.total) problems.push('starter already passes every test');
  } else if (sol.errors) problems.push(`solution raised at run time:\n${sol.errors}`);

  if (s.lang === 'gui' && s.preview && sol.compiled) {
    const pv = runProgram(s, s.solution ?? s.starter, { preview: true });
    if (!pv.compiled || !/@@GUI \d+ \d+/.test(pv.stdout)) problems.push(`preview failed:\n${pv.errors || pv.stdout.slice(0, 400)}`);
  }

  if (problems.length) {
    bad++;
    console.log(`FAIL ${k}\n  ${problems.join('\n  ').replace(/\n/g, '\n    ')}`);
  } else {
    console.log(`ok   ${k} (${s.lang}, ${mode})`);
  }
}
console.log(`\n${keys.length - bad}/${keys.length} specs ok`);
process.exit(bad ? 1 : 0);
