// Turns a problem's PROBLEM.md (one big fenced block of hard-wrapped text from
// the course's practice exam) into structured instructions: prose paragraphs,
// code examples, and the rules (tail recursion, banned library functions).

export type Block = { kind: 'prose'; text: string } | { kind: 'code'; text: string };
export type Statement = { source: string | null; file: string | null; blocks: Block[]; rules: string[]; names: string[] };

/** Functions the student has to fill in: definitions whose body is `failwith "..."`. */
export function blankFunctions(starter: string): string[] {
  const names = new Set<string>();
  const re = /let (?:rec )?([a-z_][\w']*)[^=]*=\s*(?:\(\*[\s\S]*?\*\)\s*)*failwith/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(starter))) names.add(m[1]);
  return [...names];
}

const stripComments = (l: string) => l.replace(/\(\*.*?\*\)/g, '').trim();

function isCodeLine(raw: string): boolean {
  const l = stripComments(raw);
  if (!l) return /^\s*\(\*/.test(raw);
  if (/^let\s/.test(l)) return true;
  if (/^[a-z_][\w.']*\s*:\s*\S.*->/.test(l)) return true; // signature
  if (/^[a-z_][\w.']*(\s+\S+)*\s+=\s+\S/.test(l) && !/\b(the|is|are|when|which|returns|means)\b/.test(l)) return true;
  return false;
}

const RULE = /\b(must be tail recursive|tail recursive|do not use|don't use|may not use|must not|without using)\b/i;
const NOISE = /^your score is based|partial solutions earn partial credit/i;

/** Split a paragraph into sentences, keeping the punctuation. */
// Split only where punctuation is followed by whitespace, so "imp.ml" and "..." stay intact.
const sentences = (p: string) => p.split(/(?<=[.!?])\s+(?=[A-Z(`"'\[])/).map((s) => s.trim()).filter(Boolean);

export function parseStatement(md: string, starter: string): Statement {
  const file = md.match(/^File: `([^`]+)`/m)?.[1] ?? null;
  const fence = md.match(/```[^\n]*\n([\s\S]*?)\n```/);
  const body = (fence ? fence[1] : md.replace(/^#.*$/m, '')).replace(/\r/g, '');
  const names = blankFunctions(starter);
  const lines = body.split('\n');

  // First line is a source ("Homework 4, Problem 8: reverse") or just the title.
  let source: string | null = null;
  const first = lines[0]?.trim() ?? '';
  if (/^(Homework|HW|Problem|Practice)/i.test(first)) source = first.replace(/:\s*.*$/, '');
  lines.shift();

  // Group into chunks separated by blank lines.
  const chunks: string[][] = [];
  let cur: string[] = [];
  for (const l of lines) {
    if (!l.trim()) {
      if (cur.length) chunks.push(cur);
      cur = [];
    } else cur.push(l);
  }
  if (cur.length) chunks.push(cur);

  const blocks: Block[] = [];
  const rules: string[] = [];
  const startsItem = (l: string) => names.some((n) => new RegExp(`^${n}\\b`).test(l.trim()));

  for (const chunk of chunks) {
    const codeLines = chunk.filter(isCodeLine).length;
    if (codeLines * 2 >= chunk.length) {
      blocks.push({ kind: 'code', text: chunk.join('\n') });
      continue;
    }
    // Prose: rejoin hard-wrapped lines, but start a new paragraph where a line
    // introduces one of the functions to write ("iter f l calls ...").
    const paras: string[] = [];
    for (const l of chunk) {
      const prev = paras[paras.length - 1];
      if (prev !== undefined && !(startsItem(l) && /[.:]$/.test(prev))) paras[paras.length - 1] = `${prev} ${l.trim()}`;
      else paras.push(l.trim());
    }
    for (const p of paras) {
      const keep: string[] = [];
      for (const s of sentences(p)) {
        if (NOISE.test(s)) continue;
        if (RULE.test(s)) {
          if (/tail recursive/i.test(s)) {
            if (!rules.some((r) => r.startsWith('Must be tail recursive'))) {
              rules.push('Must be tail recursive. A hidden test runs it on a very large input, so a non-tail-recursive answer overflows the stack.');
            }
          } else rules.push(s.replace(/^\s*-+\s*/, ''));
        } else keep.push(s);
      }
      if (keep.length) blocks.push({ kind: 'prose', text: keep.join(' ') });
    }
  }
  return { source, file, blocks, rules, names };
}

/** Pieces of a prose paragraph, with code-ish words marked so they render as <code>. */
export function inlineCode(text: string, names: string[]): { code: boolean; text: string }[] {
  const nameAlt = names.length ? `|\\b(?:${names.join('|')})\\b` : '';
  const re = new RegExp(`(\\[[^\\]\\n]*\\]|\\b[a-z][\\w']*_[\\w']+\\b|\\bfailwith\\b|==|&&|\\|\\||\\bSome \\w+|\\bNone\\b${nameAlt})`, 'g');
  const out: { code: boolean; text: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ code: false, text: text.slice(last, m.index) });
    out.push({ code: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ code: false, text: text.slice(last) });
  return out;
}
