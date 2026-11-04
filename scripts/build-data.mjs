#!/usr/bin/env node
// Builds src/data/generated.json from data/*.json, data/exams/*.json and problems/,
// and copies any exam PDFs in source/ to public/pdfs/ so the app can link them.
// Runs automatically before `npm run dev` and `npm run build`.
// Refuses to write anything if the data has mistakes.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, statSync, cpSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const EXAM_ORDER = ['mock1', 'mock2', 'mock3', '25fa', '26sp', '25sp', '24fa'];
const KEY_STATUSES = ['official', 'mock', 'from-guide', 'derived', 'none'];
// Problems outside Midterm 2's coverage (trees, DNA/helices, sets, higher-order).
const MIDTERM1 = new Set([6, 9, 15, 18, 20, 23, 24, 25, 26, 28, 30, 36, 37, 38, 39, 42, 44, 45]);

const errors = [];
const rel = (p) => relative(ROOT, p);

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`${rel(path)}: invalid JSON: ${e.message}`);
    process.exit(1);
  }
}

const sortKey = (id) => id.split('.').map(Number);
function cmpIds(a, b) {
  const x = sortKey(a), y = sortKey(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? -1) - (y[i] ?? -1);
    if (d) return d;
  }
  return 0;
}

// '25fa 1.2-1.5' -> { exam: '25fa', items: ['1.2', ..., '1.5'] }; '26sp 3' -> the whole section.
function expandRef(ref, exams) {
  const m = ref.match(/^(\w+) (\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$/);
  if (!m) return void errors.push(`topics: can't parse exam ref ${JSON.stringify(ref)}`);
  const [, examId, lo, hiRaw] = m;
  const exam = exams.get(examId);
  if (!exam) return void errors.push(`topics: ref ${JSON.stringify(ref)} names an unknown exam`);
  const ids = exam.sections.flatMap((s) => s.items.map((it) => it.id));
  let picked;
  if (hiRaw === undefined && !lo.includes('.')) {
    picked = ids.filter((i) => i === lo || i.startsWith(lo + '.'));
  } else {
    const hi = hiRaw ?? lo;
    picked = ids.filter((i) => cmpIds(lo, i) <= 0 && cmpIds(i, hi) <= 0);
  }
  if (!picked.length) errors.push(`topics: ref ${JSON.stringify(ref)} matches no items in ${examId}`);
  return { exam: examId, label: ref, items: picked };
}

function checkExam(exam) {
  const total = exam.sections.reduce((s, x) => s + x.points, 0);
  if (total !== exam.points) errors.push(`exam ${exam.id}: sections add to ${total}, exam says ${exam.points}`);
  exam.kind ??= exam.id.startsWith('mock') ? 'mock' : 'past';
  if (!['past', 'mock'].includes(exam.kind)) errors.push(`exam ${exam.id}: kind must be "past" or "mock"`);
  for (const s of exam.sections) {
    const got = s.items.reduce((a, it) => a + it.points, 0);
    if (got !== s.points) errors.push(`exam ${exam.id} section ${s.id}: items add to ${got}, section says ${s.points}`);
    for (const it of s.items) {
      if (!KEY_STATUSES.includes(it.keyStatus)) errors.push(`exam ${exam.id} item ${it.id}: bad keyStatus ${JSON.stringify(it.keyStatus)}`);
      if (it.keyStatus !== 'none' && !it.key) errors.push(`exam ${exam.id} item ${it.id}: keyStatus ${it.keyStatus} but no key`);
    }
  }
}

// Copy source/midterm2-<id>-{blank,solutions}.pdf to public/pdfs/ and record which exist.
function pdfsFor(id) {
  const out = {};
  for (const kind of ['blank', 'solutions']) {
    const name = `midterm2-${id}-${kind}.pdf`;
    const src = join(ROOT, 'source', name);
    if (!existsSync(src)) continue;
    const destDir = join(ROOT, 'public', 'pdfs');
    mkdirSync(destDir, { recursive: true });
    const dest = join(destDir, name);
    if (!existsSync(dest) || statSync(dest).mtimeMs < statSync(src).mtimeMs) copyFileSync(src, dest);
    out[kind] = `/pdfs/${name}`;
  }
  return out;
}

const cards = load(join(DATA, 'cards.json'));
const topics = load(join(DATA, 'topics.json'));
const plan = load(join(DATA, 'plan.json'));

const exams = new Map();
for (const f of readdirSync(join(DATA, 'exams')).filter((f) => f.endsWith('.json')).sort()) {
  const exam = load(join(DATA, 'exams', f));
  checkExam(exam);
  exam.pdfs = exam.kind === 'past' ? pdfsFor(exam.id) : {};
  exams.set(exam.id, exam);
}
// Practice specs (data/practice/*.json, keyed "examId/itemId") become item.practice.
const PRACTICE_DIR = join(DATA, 'practice');
const seenPractice = new Set();
for (const f of existsSync(PRACTICE_DIR) ? readdirSync(PRACTICE_DIR).filter((f) => f.endsWith('.json')).sort() : []) {
  for (const [key, spec] of Object.entries(load(join(PRACTICE_DIR, f)))) {
    if (seenPractice.has(key)) errors.push(`practice: ${key} is defined twice (again in ${f})`);
    seenPractice.add(key);
    const [examId, itemId] = key.split('/');
    const item = exams.get(examId)?.sections.flatMap((s) => s.items).find((it) => it.id === itemId);
    if (!item) errors.push(`practice: ${key} (in ${f}) matches no exam item`);
    else item.practice = spec;
  }
}

const ordered = [
  ...EXAM_ORDER.filter((id) => exams.has(id)).map((id) => exams.get(id)),
  ...[...exams.values()].filter((e) => !EXAM_ORDER.includes(e.id)),
];

const seen = new Set();
for (const c of cards) {
  if (seen.has(c.id)) errors.push(`cards: duplicate id ${c.id}`);
  seen.add(c.id);
}
const cardTopics = new Set(cards.map((c) => c.topic));
for (const t of topics) {
  for (const ct of t.cardTopics) if (!cardTopics.has(ct)) errors.push(`topics: ${t.id} links card topic ${JSON.stringify(ct)}, which has no cards`);
  t.examRefs = t.exams.map((r) => expandRef(r, exams)).filter(Boolean);
  delete t.exams;
}
const linked = new Set(topics.flatMap((t) => t.cardTopics));
const unlinked = [...cardTopics].filter((t) => !linked.has(t));
if (unlinked.length) errors.push(`cards: topics not in the topic map: ${unlinked.sort().join(', ')}`);

const bank = new Map(load(join(ROOT, 'problems.json')).problems.map((p) => [p.id, p]));
const problemTopics = new Map();
for (const t of topics) for (const pid of t.problems) problemTopics.set(pid, [...(problemTopics.get(pid) || []), t.id]);
const problems = [];
for (const folder of readdirSync(join(ROOT, 'problems')).sort()) {
  const dir = join(ROOT, 'problems', folder);
  if (!statSync(dir).isDirectory()) continue;
  const m = folder.match(/^q(\d+)_/);
  if (!m) continue;
  const pid = Number(m[1]);
  const meta = bank.get(pid) || {};
  const md = join(dir, 'PROBLEM.md');
  problems.push({
    id: pid,
    title: meta.title || folder,
    folder,
    filename: meta.filename || '',
    topics: problemTopics.get(pid) || [],
    midterm1: MIDTERM1.has(pid),
    text: existsSync(md) ? readFileSync(md, 'utf8') : '',
    starter: meta.starter || '',
    prelude: meta.prelude || '',
    extraTests: meta.extraTests || '',
    extraInsideModule: !!meta.extraInsideModule,
  });
}
problems.sort((a, b) => a.id - b.id);
for (const [pid, tids] of problemTopics) {
  if (MIDTERM1.has(pid)) errors.push(`topics: problem ${pid} is mapped to ${tids.join(', ')} but marked Midterm 1`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// Tail-recursion drills (data/drills.json) and ASM practice (data/asm.json) are optional.
const drills = existsSync(join(DATA, 'drills.json')) ? load(join(DATA, 'drills.json')) : [];
const drillIds = new Set();
for (const d of drills) {
  if (drillIds.has(d.id)) errors.push(`drills: duplicate id ${d.id}`);
  drillIds.add(d.id);
  if (!d.practice?.starter || !d.practice?.tests) errors.push(`drills: ${d.id} needs practice.starter and practice.tests`);
}

const asm = existsSync(join(DATA, 'asm.json')) ? load(join(DATA, 'asm.json')) : { rules: [], lessons: [], quizzes: [] };
function checkState(where, st) {
  const ids = new Set((st.heap ?? []).map((c) => c.id));
  const refs = [
    ...(st.stack ?? []).filter((e) => e.value).map((e) => e.value),
    ...(st.heap ?? []).flatMap((c) => (c.fields ?? []).map((f) => f.value)),
  ];
  for (const v of refs) {
    if (!v || (v.lit === undefined && v.ref === undefined)) errors.push(`asm: ${where}: a value must be {lit} or {ref}`);
    else if (v.ref !== undefined && !ids.has(v.ref)) errors.push(`asm: ${where}: points to missing heap cell ${v.ref}`);
  }
}
const asmIds = new Set();
for (const l of asm.lessons ?? []) {
  if (asmIds.has(l.id)) errors.push(`asm: duplicate id ${l.id}`);
  asmIds.add(l.id);
  const nLines = l.code.split('\n').length;
  l.steps.forEach((st, i) => {
    checkState(`${l.id} step ${i + 1}`, st);
    const ls = Array.isArray(st.line) ? st.line : st.line == null ? [] : [st.line];
    if (ls.some((n) => n < 1 || n > nLines)) errors.push(`asm: ${l.id} step ${i + 1}: line out of range`);
    if (st.ask && !(st.ask.answer >= 0 && st.ask.answer < st.ask.choices.length)) errors.push(`asm: ${l.id} step ${i + 1}: bad answer index`);
  });
}
for (const q of asm.quizzes ?? []) {
  if (asmIds.has(q.id)) errors.push(`asm: duplicate id ${q.id}`);
  asmIds.add(q.id);
  if (!(q.answer >= 0 && q.answer < q.choices.length)) errors.push(`asm: quiz ${q.id}: bad answer index`);
  q.choices.forEach((c, i) => c.state && checkState(`quiz ${q.id} choice ${i + 1}`, c.state));
  if (q.picture) checkState(`quiz ${q.id} picture`, q.picture);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

// The OCaml toplevel for the browser (about 13 MB), served from /ocaml/.
const ocamlSrc = join(ROOT, 'node_modules', '@live-codes', 'ocaml', 'assets', 'interpreter');
const ocamlDest = join(ROOT, 'public', 'ocaml');
if (!existsSync(ocamlSrc)) {
  console.error('node_modules/@live-codes/ocaml is missing: run npm install');
  process.exit(1);
}
if (!existsSync(join(ocamlDest, 'worker.js')) || statSync(join(ocamlDest, 'worker.js')).mtimeMs < statSync(join(ocamlSrc, 'worker.js')).mtimeMs) {
  cpSync(ocamlSrc, ocamlDest, { recursive: true });
}

// Course library stand-ins and the user's HW5 GUI library, used to build runnable programs.
const libFile = (f) => readFileSync(join(ROOT, 'practice', 'lib', f), 'utf8');
const practiceLibs = { assert: libFile('assert.ml'), g: libFile('g.ml'), gctx: libFile('gctx.ml'), widget: libFile('widget.ml'), harness: libFile('harness.ml') };

const out = join(ROOT, 'src', 'data', 'generated.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ cards, topics, plan, exams: ordered, problems, practiceLibs, drills, asm }) + '\n');
const nItems = ordered.reduce((n, e) => n + e.sections.reduce((m, s) => m + s.items.length, 0), 0);
const nPdfs = ordered.reduce((n, e) => n + Object.keys(e.pdfs).length, 0);
console.log(`wrote ${rel(out)}: ${cards.length} cards, ${ordered.length} exams (${nItems} items), ` +
  `${topics.length} topics, ${problems.length} problems, ${nPdfs} PDFs linked, ${seenPractice.size} practice specs, ${drills.length} drills, ${(asm.lessons ?? []).length} ASM lessons`);
