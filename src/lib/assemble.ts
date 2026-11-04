// Builds the one runnable program for a piece of student code, the same way
// in the browser (src/lib/runners) and in scripts/check-practice.ts (native
// ocamlc / javac). Keep this file free of TypeScript-only runtime syntax
// (enums, namespaces) so Node can run it with type stripping.

export type Lang = 'ocaml' | 'java' | 'gui';

/** How an exam item can be practised in the editor. */
export type Practice = {
  lang: Lang;
  /** 'tests': hidden tests grade the code. 'run': just run it and show the output. */
  mode?: 'tests' | 'run';
  /** Hidden code placed before the student's (types, helpers, given functions). */
  setup?: string;
  /** What the editor starts with. */
  starter: string;
  /** A full answer for the editable part; passes every test. */
  solution?: string;
  /** Hidden tests placed after the student's code. */
  tests?: string;
  /** GUI only: an OCaml expression of type Widget.widget to show live. */
  preview?: string;
  /**
   * Optional: a correct but NOT tail-recursive answer. The checker requires it
   * to fail only the tail-recursion tests (names containing "tail recursi"),
   * which proves those tests really catch non-tail-recursive code.
   */
  nonTail?: string;
};

export type Libs = { assert: string; g: string; gctx: string; widget: string; harness: string };

export type Assembled = { program: string; offset: number };

const mod = (name: string, body: string) => `module ${name} = struct\n${body}\nend\n`;
const lineCount = (s: string) => s.split('\n').length - 1;

export const DEFAULT_STRESS_N = 100000;

function ocamlPrelude(libs: Libs, gui: boolean, stressN: number): string {
  let s = mod('Assert', libs.assert.replace(/let stress_n = \d+/, `let stress_n = ${stressN}`)) + ';; open Assert\n';
  if (gui) {
    s += mod('G', libs.g) + mod('Gctx', libs.gctx) + mod('Widget', libs.widget) + mod('Harness', libs.harness);
    s += ';; open Gctx\n;; open Widget\n';
  }
  return s;
}

/**
 * OCaml (and GUI) programs. Student code is wrapped in `include struct ... end`
 * because the browser toplevel parses top-level phrases, where `;; f x`
 * followed by `let ...` is a syntax error; inside a structure it is fine.
 */
export function assembleOcaml(
  p: Practice,
  code: string,
  libs: Libs,
  opts: { stressN?: number; tests?: boolean } = {},
): Assembled {
  const withTests = opts.tests ?? p.mode !== 'run';
  const head =
    ocamlPrelude(libs, p.lang === 'gui', opts.stressN ?? DEFAULT_STRESS_N) +
    (p.setup ? `${p.setup}\n` : '') +
    'include struct\n';
  const tail = '\nend\n' + (withTests ? `${p.tests ?? ''}\n;; let () = Assert.summary ()\n` : '');
  return { program: head + code + tail, offset: lineCount(head) };
}

const JAVA_HELPERS = `  static int __passed = 0, __failed = 0;
  static void check(String name, java.util.function.BooleanSupplier test) {
    try {
      if (test.getAsBoolean()) { __passed++; System.out.println("PASS  " + name); }
      else { __failed++; System.out.println("FAIL  " + name + "  (returned false)"); }
    } catch (Throwable e) {
      __failed++;
      System.out.println("FAIL  " + name + "  (threw " + e + ")");
    }
  }
`;

/**
 * Java programs: everything lives in one public class Main.
 * 'tests' mode: student code holds members (usually static methods); `tests`
 * must define `static void tests()` that calls check(name, () -> bool).
 * 'run' mode: student code is the body of main.
 */
export function assembleJava(p: Practice, code: string): Assembled {
  const setup = p.setup ? `${p.setup}\n` : '';
  if (p.mode === 'run') {
    const head = `import java.util.*;\n\npublic class Main {\n${setup}  public static void main(String[] args) throws Exception {\n`;
    return { program: `${head}${code}\n  }\n}\n`, offset: lineCount(head) };
  }
  const head = `import java.util.*;\n\npublic class Main {\n${JAVA_HELPERS}${setup}`;
  const tail = `\n${p.tests ?? ''}\n  public static void main(String[] args) {\n    tests();\n    System.out.println("SUMMARY " + __passed + "/" + (__passed + __failed) + " passed");\n  }\n}\n`;
  return { program: head + code + tail, offset: lineCount(head) };
}

/** The 46 problem-bank problems (format from pe8-arena's program.js). */
export type BankProblem = { prelude: string; extraTests?: string; extraInsideModule?: boolean };

export function assembleProblem(problem: BankProblem, code: string, stressN = DEFAULT_STRESS_N): Assembled {
  const prelude = problem.prelude.replace(/let stress_n = \d+/, `let stress_n = ${stressN}`);
  let body = code;
  const extra = problem.extraTests ?? '';
  if (extra) {
    const header = '\n(* ---- Extra tests from the problem statement ---- *)\n';
    const trimmed = code.replace(/\s+$/, '');
    const idx = trimmed.lastIndexOf('\nend');
    if (problem.extraInsideModule && idx >= 0) {
      body = `${trimmed.slice(0, idx)}\n${header}${extra}${trimmed.slice(idx)}\n`;
    } else {
      body = `${trimmed}\n${header}${code.includes(';; open Assert') ? '' : ';; open Assert\n'}${extra}`;
    }
  }
  const head = `${prelude}\ninclude struct\n`;
  return { program: `${head}${body}\nend\n;; let () = Assert.summary ()\n`, offset: lineCount(head) };
}

// ---------- results ----------

export type TestLine = { ok: boolean; name: string; detail: string };
export type Results = { tests: TestLine[]; passed: number; total: number; summary: boolean };

/** Reads PASS/FAIL/SUMMARY lines (same format from OCaml's Assert and the Java helpers). */
export function parseResults(stdout: string): Results {
  const tests: TestLine[] = [];
  let summary: { passed: number; total: number } | null = null;
  for (const line of (stdout || '').split('\n')) {
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^PASS {2}(.*)$/))) tests.push({ ok: true, name: m[1], detail: '' });
    else if ((m = line.match(/^FAIL {2}(.*?)(?: {2}\((.*)\))?$/))) tests.push({ ok: false, name: m[1], detail: m[2] ?? '' });
    else if ((m = line.match(/^SUMMARY (\d+)\/(\d+) passed/))) summary = { passed: +m[1], total: +m[2] };
  }
  return {
    tests,
    passed: summary ? summary.passed : tests.filter((t) => t.ok).length,
    total: summary ? summary.total : tests.length,
    summary: !!summary,
  };
}

/** Output with the PASS/FAIL/SUMMARY lines removed (what the student printed). */
export function userOutput(stdout: string): string {
  return (stdout || '')
    .split('\n')
    .filter((l) => !/^(PASS|FAIL) {2}|^SUMMARY \d+\/\d+ passed|^@@/.test(l))
    .join('\n')
    .replace(/\s+$/, '');
}

/** Rewrites "Line N" / "Main.java:N" in compiler messages to the student's own line numbers. */
export function shiftLines(message: string, offset: number): string {
  const shift = (n: string) => String(Math.max(1, Number(n) - offset));
  return message
    .replace(/\bLines? (\d+)(?:-(\d+))?/g, (_a, a: string, b?: string) => (b ? `Lines ${shift(a)}-${shift(b)}` : `Line ${shift(a)}`))
    .replace(/Main\.java:(\d+)/g, (_a, n: string) => `line ${shift(n)}`);
}

/**
 * Drops compiler warnings from the toplevel's stderr after a successful compile.
 * The browser toplevel prints them as bare location lines ("Lines 608-611,
 * characters 4-7:") that point into the course libraries, sometimes followed by
 * "Warning N: ..." text. Real runtime errors (uncaught exceptions) are kept.
 */
export function dropWarnings(stderr: string): string {
  const loc = /^(?:File "[^"]*", )?[Ll]ines? \d+(?:-\d+)?, characters \d+-\d+:$/;
  const out: string[] = [];
  let inWarning = false;
  for (const line of (stderr || '').split('\n')) {
    if (loc.test(line.trim())) { inWarning = true; continue; }
    if (/^(?:Warning|Alert)\b/.test(line.trim())) { inWarning = true; continue; }
    if (inWarning && /^\s/.test(line)) continue; // indented continuation of a warning
    inWarning = false;
    out.push(line);
  }
  return out.join('\n').trim();
}
