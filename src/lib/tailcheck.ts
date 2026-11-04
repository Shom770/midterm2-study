// A static tail-call checker for student OCaml.
//
// The browser's OCaml runtime (js_of_ocaml with effects) runs functions that
// call closures in continuation-passing style, so non-tail recursion through
// such functions never overflows the stack there, however large the input.
// So this reads the code instead: it parses a practical subset of OCaml and
// checks that every recursive call to a `let rec` function is in tail
// position, using OCaml's rules (if/match branches, after `;` and `in`, the
// right side of && and ||), and explains each failure.
// Keep it free of TypeScript-only runtime syntax: Node runs it directly.

type Tok = { t: string; v: string; line: number };

export type TailIssue = { line: number; fn: string; call: string; reason: string };
export type TailReport =
  | { status: 'ok'; checked: string[] }
  | { status: 'fail'; issues: TailIssue[]; checked: string[] }
  | { status: 'unknown'; why: string };

const KEYWORDS = new Set(['let', 'rec', 'in', 'and', 'fun', 'function', 'match', 'with', 'if', 'then', 'else', 'begin', 'end', 'try', 'when', 'type', 'of', 'open', 'module', 'struct', 'sig', 'exception', 'mutable', 'not', 'true', 'false', 'mod', 'land', 'lor', 'lxor', 'lsl', 'lsr', 'asr', 'or', 'as', 'val', 'external', 'include', 'for', 'while', 'do', 'done', 'to', 'downto']);
const OPENERS = new Set(['(', '[', '{', '[|', 'begin']);
const CLOSERS = new Set([')', ']', '}', '|]', 'end']);

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (src.startsWith('(*', i)) {
      let depth = 1;
      i += 2;
      while (i < n && depth) {
        if (src.startsWith('(*', i)) { depth++; i += 2; }
        else if (src.startsWith('*)', i)) { depth--; i += 2; }
        else { if (src[i] === '\n') line++; i++; }
      }
      continue;
    }
    if (c === '"') {
      const start = line;
      let j = i + 1;
      while (j < n && src[j] !== '"') { if (src[j] === '\\') j++; if (src[j] === '\n') line++; j++; }
      out.push({ t: 'lit', v: src.slice(i, j + 1), line: start });
      i = j + 1;
      continue;
    }
    if (c === "'") {
      const ch = src.slice(i).match(/^'(\\[^']*|[^\\'])'/);
      if (ch) { out.push({ t: 'lit', v: ch[0], line }); i += ch[0].length; continue; }
      const tv = src.slice(i).match(/^'[a-z_]\w*/);
      if (tv) { out.push({ t: 'lit', v: tv[0], line }); i += tv[0].length; continue; }
    }
    if (/\d/.test(c)) {
      const m = src.slice(i).match(/^\d[\d_]*(\.\d*)?([eE][-+]?\d+)?/)!;
      out.push({ t: 'lit', v: m[0], line });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const w = src.slice(i).match(/^[A-Za-z_][\w']*/)![0];
      out.push({ t: KEYWORDS.has(w) ? w : /^[A-Z]/.test(w) ? 'Uid' : 'id', v: w, line });
      i += w.length;
      continue;
    }
    const sym = ['[|', '|]', ';;', '->', '<-', ':=', '::', '&&', '||', '|>', '@@', '**'].find((s) => src.startsWith(s, i));
    if (sym) {
      out.push({ t: sym === '|>' || sym === '@@' ? 'op' : sym, v: sym, line });
      i += sym.length;
      continue;
    }
    if ('()[]{},;|.~?:'.includes(c)) { out.push({ t: c, v: c, line }); i++; continue; }
    const op = src.slice(i).match(/^[=<>@^+\-*\/%&$!]+/);
    if (op) { out.push({ t: op[0] === '!' ? '!' : 'op', v: op[0], line }); i += op[0].length; continue; }
    throw new Error(`unexpected character ${JSON.stringify(c)} on line ${line}`);
  }
  out.push({ t: 'eof', v: '', line });
  return out;
}

// Why a position is not a tail position; null means it is one.
type Ctx = string | null;
type Pending = { p: number; fn: string; call: string };

const LEVELS: { is: (t: Tok) => boolean; right: boolean; lazy?: boolean }[] = [
  { is: (t) => t.t === ',', right: false },
  { is: (t) => t.t === '<-' || t.t === ':=', right: true },
  { is: (t) => t.t === '||' || t.t === 'or', right: true, lazy: true },
  { is: (t) => t.t === '&&' || (t.t === 'op' && t.v === '&'), right: true, lazy: true },
  { is: (t) => t.t === 'op' && /^[=<>|&$]/.test(t.v), right: false },
  { is: (t) => t.t === 'op' && /^[@^]/.test(t.v), right: true },
  { is: (t) => t.t === '::', right: true },
  { is: (t) => t.t === 'op' && /^[+-]/.test(t.v), right: false },
  { is: (t) => (t.t === 'op' && /^[*\/%]/.test(t.v)) || ['mod', 'land', 'lor', 'lxor'].includes(t.t), right: false },
  { is: (t) => t.t === '**' || ['lsl', 'lsr', 'asr'].includes(t.t), right: true },
];

const describe = (t: Tok) => (t.t === ',' ? 'its result is put in a tuple' : `its result is passed to ${t.v}`);

class Checker {
  private p = 0;
  private active: { names: Set<string>; fn: string } | null = null;
  private pending: Pending[] = [];
  /** Inside a function the caller asked to check (so its local `let rec` helpers count too). */
  private inWanted = false;
  issues: (TailIssue & { p: number })[] = [];
  checked: string[] = [];

  private toks: Tok[];
  private only: Set<string> | null;
  constructor(toks: Tok[], only: Set<string> | null) {
    this.toks = toks;
    this.only = only;
  }

  private get tok() { return this.toks[this.p]; }
  private at(...ts: string[]) { return ts.includes(this.tok.t); }
  private next() { return this.toks[this.p++]; }
  private expect(t: string, v?: string) {
    if (this.tok.t !== t || (v !== undefined && this.tok.v !== v)) {
      throw new Error(`expected ${v ?? t} but found "${this.tok.v || this.tok.t}" on line ${this.tok.line}`);
    }
    return this.next();
  }
  private isEq() { return this.tok.t === 'op' && this.tok.v === '='; }

  /** Skip a pattern or type annotation up to a stop token at bracket depth 0. */
  private skipUntil(stops: (t: Tok) => boolean) {
    let depth = 0;
    while (!this.at('eof')) {
      if (depth === 0 && stops(this.tok)) return;
      if (OPENERS.has(this.tok.t)) depth++;
      else if (CLOSERS.has(this.tok.t)) {
        if (depth === 0) return;
        depth--;
      }
      this.next();
    }
  }

  /** Calls recorded as tail calls inside [a, p) turn out not to be: record them as issues. */
  private demote(a: number, reason: string) {
    const keep: Pending[] = [];
    for (const c of this.pending) {
      if (c.p >= a && c.p < this.p) this.issues.push({ line: this.toks[c.p].line, fn: c.fn, call: c.call, reason, p: c.p });
      else keep.push(c);
    }
    this.pending = keep;
  }

  // ---------- top level ----------
  program() {
    while (!this.at('eof')) {
      if (this.at(';;') || this.at('end') || this.at('struct')) { this.next(); continue; }
      if (this.at('let')) {
        this.next();
        if (this.at('open')) { this.skipTop(); continue; }
        const rec = this.at('rec') ? (this.next(), true) : false;
        this.bindings(rec);
        if (this.at('in')) { this.next(); this.seq('it is at the top level'); }
        continue;
      }
      if (this.at('type', 'open', 'exception', 'module', 'include', 'external', 'val')) { this.next(); this.skipTop(); continue; }
      this.seq('it is at the top level');
    }
  }

  private skipTop() {
    while (!this.at('eof', 'let', ';;', 'type', 'exception')) this.next();
  }

  /** Names bound by `let rec f ... and g ...` (for mutual recursion). */
  private recNames(): string[] {
    const names = [this.tok.v];
    let depth = 0;
    for (let q = this.p + 1; this.toks[q].t !== 'eof'; q++) {
      const t = this.toks[q].t;
      if (t === ';;') break;
      if (t === 'let') { if (depth === 0 && this.active === null) break; depth++; }
      else if (t === 'in') depth = Math.max(0, depth - 1);
      else if (t === 'and' && depth === 0 && this.toks[q + 1]?.t === 'id') names.push(this.toks[q + 1].v);
    }
    return names;
  }

  private bindings(rec: boolean) {
    const names = rec && this.at('id') ? this.recNames() : [];
    for (;;) {
      let name = '';
      let hasParams = false;
      if (this.at('id') && this.toks[this.p + 1].t !== ',') {
        name = this.next().v;
        hasParams = !this.isEq() && !this.at(':');
      }
      this.skipUntil((t) => t.t === 'op' && t.v === '=');
      this.expect('op', '=');
      const isFn = hasParams || this.at('fun', 'function');
      const wanted = !this.only || this.only.has(name) || this.inWanted;
      const outerWanted = this.inWanted;
      if (rec && isFn && name && wanted) {
        const outer = this.active;
        const outerPending = this.pending;
        this.active = { names: new Set(names), fn: name };
        this.pending = [];
        this.inWanted = true;
        if (!this.checked.includes(name)) this.checked.push(name);
        this.fnBody(hasParams, null);
        this.active = outer;
        this.pending = outerPending;
        this.inWanted = outerWanted;
      } else if (isFn) {
        this.inWanted = wanted;
        this.fnBody(hasParams, 'it is inside another function');
        this.inWanted = outerWanted;
      } else {
        this.exprNoSeq('its result is bound with let');
      }
      if (!this.at('and')) return;
      this.next();
    }
  }

  private fnBody(hasParams: boolean, ctx: Ctx) {
    if (!hasParams && this.at('fun')) {
      this.next();
      this.skipUntil((t) => t.t === '->');
      this.expect('->');
      return this.seq(ctx);
    }
    if (!hasParams && this.at('function')) { this.next(); return this.arms(ctx); }
    this.seq(ctx);
  }

  // ---------- expressions ----------

  /** e1; e2; e3 — only the last is in the surrounding context. */
  private seq(ctx: Ctx) {
    for (;;) {
      const start = this.p;
      this.exprNoSeq(ctx);
      if (!this.at(';')) return;
      const after = this.toks[this.p + 1].t;
      if (['end', ')', ']', '}', 'in', 'eof', ';;', 'with', '|', 'and', 'then', 'else', 'done', 'let'].includes(after) && after !== 'let') {
        this.next(); // trailing ;
        return;
      }
      if (after === 'let' && this.active === null) { this.next(); return; }
      this.demote(start, 'code after it (following ;) still has to run');
      this.next();
    }
  }

  private exprNoSeq(ctx: Ctx): void {
    const t = this.tok.t;
    if (t === 'let') {
      this.next();
      if (this.at('open')) { this.next(); this.next(); this.expect('in'); return this.seq(ctx); }
      const rec = this.at('rec') ? (this.next(), true) : false;
      this.bindings(rec);
      this.expect('in');
      return this.seq(ctx);
    }
    if (t === 'fun') {
      this.next();
      this.skipUntil((x) => x.t === '->');
      this.expect('->');
      return this.seq('it is inside an anonymous function');
    }
    if (t === 'function') { this.next(); return this.arms('it is inside an anonymous function'); }
    if (t === 'match') {
      this.next();
      this.seq('it is the value being matched on');
      this.expect('with');
      return this.arms(ctx);
    }
    if (t === 'try') {
      this.next();
      this.seq('it is inside try … with, which stays on the stack to catch exceptions');
      this.expect('with');
      return this.arms(ctx);
    }
    if (t === 'if') {
      this.next();
      this.seq('it is the condition of an if');
      this.expect('then');
      this.exprNoSeq(ctx);
      if (this.at('else')) { this.next(); this.exprNoSeq(ctx); }
      return;
    }
    this.binop(0, ctx);
  }

  private arms(ctx: Ctx) {
    if (this.at('|')) this.next();
    for (;;) {
      this.skipUntil((x) => x.t === '->' || x.t === 'when');
      if (this.at('when')) { this.next(); this.seq('it is in a when guard'); }
      this.expect('->');
      this.seq(ctx);
      if (!this.at('|')) return;
      this.next();
    }
  }

  private binop(level: number, ctx: Ctx): void {
    if (level >= LEVELS.length) return this.unary(ctx);
    const L = LEVELS[level];
    const start = this.p;
    this.binop(level + 1, ctx);
    if (!L.is(this.tok)) return;
    // The left operand is not in tail position: something still uses its result.
    const op = this.tok;
    this.demote(start, L.lazy ? `it is the left side of ${op.v}, which still has to check its result` : describe(op));
    while (L.is(this.tok)) {
      const o = this.next();
      const rStart = this.p;
      const rctx = L.lazy ? ctx : describe(o);
      if (this.at('if', 'match', 'fun', 'function', 'let', 'try')) this.exprNoSeq(rctx);
      else this.binop(L.right ? level : level + 1, rctx);
      if (L.is(this.tok) && !L.right) this.demote(rStart, describe(this.tok));
    }
  }

  private unary(ctx: Ctx): void {
    if (this.at('op') && (this.tok.v === '-' || this.tok.v === '-.')) { this.next(); return this.unary('its result is negated'); }
    if (this.at('not')) { this.next(); return this.unary('its result is passed to not'); }
    this.app(ctx);
  }

  private startsSimple() {
    return ['id', 'Uid', 'lit', '(', '[', '[|', '{', 'begin', 'true', 'false', '!', '~', '?'].includes(this.tok.t);
  }

  private app(ctx: Ctx) {
    const headP = this.p;
    const head = this.tok;
    if (head.t === 'Uid' && this.toks[this.p + 1].t !== '.') {
      this.next();
      if (this.startsSimple()) this.simple(`its result is put inside the constructor ${head.v}`);
      return;
    }
    const name = this.simple(ctx);
    let nargs = 0;
    while (this.startsSimple()) {
      if (this.at('~', '?')) {
        this.next();
        this.next();
        if (!this.at(':')) { nargs++; continue; }
        this.next();
      }
      nargs++;
      this.simple(name ? `its result is passed as an argument to ${name}` : 'its result is passed as an argument');
    }
    if (name && nargs > 0 && this.active?.names.has(name)) {
      const call = this.render(headP, this.p);
      if (ctx) this.issues.push({ line: head.line, fn: this.active.fn, call, reason: ctx, p: headP });
      else this.pending.push({ p: headP, fn: this.active.fn, call });
    }
  }

  private render(a: number, b: number) {
    const s = this.toks
      .slice(a, b)
      .map((t) => t.v)
      .join(' ')
      .replace(/([(\[]) /g, '$1')
      .replace(/ ([)\],;])/g, '$1')
      .replace(/ \. /g, '.');
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  }

  /** Atoms and field access. Returns the identifier if this is a plain variable. */
  private simple(ctx: Ctx): string | null {
    let name: string | null = null;
    const t = this.tok.t;
    if (t === '!') { this.next(); this.simple('it is dereferenced with !'); return null; }
    if (t === 'id') name = this.next().v;
    else if (t === 'Uid') {
      this.next();
      while (this.at('.')) {
        this.next();
        if (this.at('Uid')) { this.next(); continue; }
        if (this.at('id')) { this.next(); break; }
        if (this.at('(')) { this.next(); this.seq('it is inside a local open'); this.expect(')'); break; }
        throw new Error(`unexpected "${this.tok.v}" on line ${this.tok.line}`);
      }
      return null;
    } else if (t === 'lit' || t === 'true' || t === 'false') this.next();
    else if (t === '(') {
      this.next();
      if (this.at(')')) this.next();
      else if ((this.at('op', '::', '&&', '||')) && this.toks[this.p + 1].t === ')') { this.next(); this.next(); }
      else {
        this.seq(ctx);
        if (this.at(':')) { this.next(); this.skipUntil((x) => x.t === ')'); }
        this.expect(')');
      }
    } else if (t === 'begin') {
      this.next();
      if (!this.at('end')) this.seq(ctx);
      this.expect('end');
    } else if (t === '[' || t === '[|') {
      const close = t === '[' ? ']' : '|]';
      this.next();
      while (!this.at(close)) {
        this.exprNoSeq('its result is put in a list');
        if (!this.at(';')) break;
        this.next();
      }
      this.expect(close);
    } else if (t === '{') {
      this.next();
      let depth = 0;
      let isWith = false;
      for (let q = this.p; this.toks[q].t !== 'eof'; q++) {
        const tq = this.toks[q].t;
        if (OPENERS.has(tq)) depth++;
        else if (CLOSERS.has(tq)) { if (depth === 0) break; depth--; }
        else if (tq === 'with' && depth === 0) { isWith = true; break; }
        else if (tq === 'op' && this.toks[q].v === '=' && depth === 0) break;
      }
      if (isWith) { this.simple('it is copied with { … with … }'); this.expect('with'); }
      while (!this.at('}')) {
        this.skipUntil((x) => (x.t === 'op' && x.v === '=') || x.t === ';' || x.t === '}');
        if (this.isEq()) { this.next(); this.exprNoSeq('its result is stored in a record field'); }
        if (!this.at(';')) break;
        this.next();
      }
      this.expect('}');
    } else {
      throw new Error(`unexpected "${this.tok.v || this.tok.t}" on line ${this.tok.line}`);
    }
    while (this.at('.') && ['id', 'Uid'].includes(this.toks[this.p + 1].t)) {
      this.next();
      if (this.at('Uid')) { this.next(); if (this.at('.')) this.next(); }
      if (this.at('id')) this.next();
      name = null;
    }
    return name;
  }
}

/**
 * Check that every recursive call in `code` is a tail call.
 * `only`: check just these top-level functions (and helpers defined inside them).
 */
export function checkTailCalls(code: string, only?: string[]): TailReport {
  try {
    const c = new Checker(lex(code), only?.length ? new Set(only) : null);
    c.program();
    if (!c.checked.length) return { status: 'unknown', why: 'there is no recursive function to check' };
    const seen = new Set<string>();
    const issues = c.issues
      .sort((a, b) => a.p - b.p)
      .filter((i) => {
        const k = `${i.p}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(({ line, fn, call, reason }) => ({ line, fn, call, reason }));
    return issues.length ? { status: 'fail', issues, checked: c.checked } : { status: 'ok', checked: c.checked };
  } catch (e) {
    return { status: 'unknown', why: (e as Error).message };
  }
}
