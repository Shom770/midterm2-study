// Syntax highlighting shared by the editor and static code blocks.
// One tag-to-class map (tk-*) is styled in globals.css, so the editor and
// read-only code look the same.
import { javaLanguage } from '@codemirror/lang-java';
import { StreamLanguage, type StringStream } from '@codemirror/language';
import { highlightTree, tagHighlighter, tags as t } from '@lezer/highlight';

// ---------- OCaml ----------
// The stock legacy mode calls almost every word "variable". This one tells
// apart keywords, definitions, types, constructors, modules and fields.

const CONTROL = new Set(['match', 'with', 'if', 'then', 'else', 'begin', 'end', 'fun', 'function', 'try', 'raise', 'when', 'for', 'while', 'do', 'done', 'to', 'downto', 'assert', 'failwith']);
const DECL = new Set(['let', 'rec', 'and', 'in', 'type', 'of', 'mutable', 'module', 'struct', 'sig', 'open', 'include', 'val', 'functor', 'exception', 'external', 'as', 'not', 'ref', 'lsl', 'lsr', 'land', 'lor', 'lxor', 'mod']);
const BUILTIN_TYPES = new Set(['int', 'bool', 'string', 'unit', 'list', 'option', 'char', 'float', 'array', 'ref', 'exn']);

type OState = { comment: number; afterLet: boolean; inType: boolean; afterDot: boolean };

function ocamlToken(s: StringStream, st: OState): string | null {
  if (st.comment > 0) {
    while (!s.eol()) {
      if (s.match('(*')) st.comment++;
      else if (s.match('*)')) {
        st.comment--;
        if (st.comment === 0) break;
      } else s.next();
    }
    return 'comment';
  }
  if (s.eatSpace()) return null;
  if (s.match('(*')) {
    st.comment = 1;
    return ocamlToken(s, st) ?? 'comment';
  }
  const ch = s.peek()!;
  const afterDot = st.afterDot;
  st.afterDot = false;

  if (ch === '"') {
    s.next();
    let esc = false;
    while (!s.eol()) {
      const c = s.next();
      if (c === '"' && !esc) break;
      esc = !esc && c === '\\';
    }
    return 'string';
  }
  if (ch === "'") {
    if (s.match(/^'(\\.|[^\\'])'/)) return 'character';
    if (s.match(/^'[a-z_]\w*/)) return 'typeName';
    s.next();
    return 'punctuation';
  }
  if (/\d/.test(ch)) {
    s.match(/^\d[\d_]*(\.\d*)?([eE][-+]?\d+)?/);
    return 'number';
  }
  if (s.match('()')) return 'atom';
  if (s.match('::')) return 'operator';
  if (s.match('->')) return 'operator';
  if (s.match('<-') || s.match(':=')) return 'operator';
  if (ch === ':') {
    s.next();
    st.inType = true;
    return 'punctuation';
  }
  if (/[=;)}|,\]]/.test(ch)) {
    s.next();
    st.inType = false;
    st.afterLet = false;
    return ch === '=' || ch === '|' ? 'operator' : 'punctuation';
  }
  if (/[(\[{]/.test(ch)) {
    s.next();
    return 'punctuation';
  }
  if (ch === '.') {
    s.next();
    st.afterDot = true;
    return 'punctuation';
  }
  if (/[+\-*/<>@^&!?~%$#]/.test(ch)) {
    s.eatWhile(/[+\-*/<>@^&!?~%$#=|.]/);
    return 'operator';
  }
  if (/[A-Za-z_]/.test(ch)) {
    s.eatWhile(/[\w']/);
    const w = s.current();
    if (w === 'true' || w === 'false') return 'bool';
    if (CONTROL.has(w)) {
      st.afterLet = false;
      if (w === 'failwith') return 'variableName.standard';
      return 'controlKeyword';
    }
    if (DECL.has(w)) {
      if (w === 'let' || w === 'rec' || w === 'and') st.afterLet = true;
      if (w === 'in') st.inType = false;
      if (w === 'type' || w === 'of') st.inType = true;
      return 'keyword';
    }
    if (/^[A-Z]/.test(w)) {
      // Module path (List.iter, Gctx.draw_line) or a constructor (Some, MouseDown).
      return s.peek() === '.' ? 'namespace' : 'className';
    }
    if (afterDot) return 'propertyName';
    if (st.inType || BUILTIN_TYPES.has(w) && st.inType) return 'typeName';
    if (st.afterLet) {
      st.afterLet = false;
      return 'variableName.definition';
    }
    return 'variableName';
  }
  s.next();
  return null;
}

export const ocamlLanguage = StreamLanguage.define<OState>({
  name: 'ocaml',
  startState: () => ({ comment: 0, afterLet: false, inType: false, afterDot: false }),
  copyState: (s) => ({ ...s }),
  token: ocamlToken,
  languageData: { commentTokens: { block: { open: '(*', close: '*)' } } },
});

// ---------- classes ----------

export const highlighter = tagHighlighter([
  { tag: [t.controlKeyword], class: 'tk-ctl' },
  { tag: [t.keyword, t.definitionKeyword, t.modifier, t.operatorKeyword, t.moduleKeyword], class: 'tk-kw' },
  { tag: [t.definition(t.variableName), t.function(t.definition(t.variableName)), t.function(t.variableName)], class: 'tk-def' },
  { tag: [t.typeName, t.standard(t.typeName)], class: 'tk-type' },
  { tag: [t.className], class: 'tk-ctor' },
  { tag: [t.namespace], class: 'tk-mod' },
  { tag: [t.propertyName], class: 'tk-prop' },
  { tag: [t.string, t.character, t.special(t.string)], class: 'tk-str' },
  { tag: [t.number], class: 'tk-num' },
  { tag: [t.bool, t.null, t.atom], class: 'tk-const' },
  { tag: [t.comment, t.lineComment, t.blockComment], class: 'tk-com' },
  { tag: [t.operator, t.arithmeticOperator, t.logicOperator, t.compareOperator, t.updateOperator], class: 'tk-op' },
  { tag: [t.standard(t.variableName)], class: 'tk-std' },
  { tag: [t.punctuation, t.bracket, t.paren, t.squareBracket, t.brace, t.separator], class: 'tk-punct' },
]);

export type Segment = { text: string; cls: string };

/** Split code into highlighted segments for read-only display. */
export function highlightSegments(code: string, lang: 'ocaml' | 'java'): Segment[] {
  const tree = (lang === 'java' ? javaLanguage : ocamlLanguage).parser.parse(code);
  const out: Segment[] = [];
  let pos = 0;
  highlightTree(tree, highlighter, (from, to, cls) => {
    if (from > pos) out.push({ text: code.slice(pos, from), cls: '' });
    out.push({ text: code.slice(from, to), cls });
    pos = to;
  });
  if (pos < code.length) out.push({ text: code.slice(pos), cls: '' });
  return out;
}

/** Guess whether a snippet is Java (exam code blocks don't say). */
export const looksLikeJava = (code: string) =>
  /\b(public|private|static|int\[\]|String|System\.out|new int|void)\b/.test(code) && !/\blet\b|\bbegin match\b/.test(code);
