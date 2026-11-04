'use client';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { cardsIn, DATA, examById, examItems, type Topic } from '@/lib/data';
import { pct } from '@/lib/format';
import { useMounted, useStored, type Attempt } from '@/lib/store';

// ---------- the tree model ----------

type Node = {
  id: string;
  label: string;
  meta?: string;
  href?: string;
  /** Best score on this exam item (0..1), or average for a topic. */
  score?: number | null;
  done?: boolean;
  children?: Node[];
};

const AREAS: { id: string; title: string; chapters: string; topics: string[] }[] = [
  { id: 'state', title: 'OCaml: state and the heap', chapters: 'Ch 11–15', topics: ['options', 'unit-records', 'asm'] },
  { id: 'queues', title: 'Queues, deques and tail calls', chapters: 'Ch 16', topics: ['tailrec', 'queues', 'deques', 'queue-invariants', 'deque-invariants'] },
  { id: 'gui', title: 'Closures and the GUI library', chapters: 'Ch 17–18', topics: ['closures', 'gui'] },
  { id: 'java', title: 'Java', chapters: 'Ch 19–21, 32–33', topics: ['java', 'arrays', 'encapsulation'] },
  { id: 'skills', title: 'Exam technique', chapters: 'Exam guide', topics: ['exam-skills'] },
];

// Which ASM lesson groups belong under which topic.
const ASM_GROUPS: Record<string, string[]> = {
  asm: ['Basics', 'Mutable records and refs', 'Options and lists', 'Equality'],
  queues: ['Queues and deques'],
  deques: ['Queues and deques'],
  closures: ['Closures and functions'],
  java: ['Java ASM'],
  arrays: ['Java ASM'],
};

const shorten = (s: string, n = 72) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const problemTitle = Object.fromEntries(DATA.problems.map((p) => [p.id, p.title]));

function topicNode(t: Topic, best: Record<string, number>, solved: Record<string, boolean>, drillsDone: Record<string, boolean>): Node {
  const children: Node[] = [];
  const n = cardsIn(t.id).length;
  if (n) children.push({ id: `${t.id}/cards`, label: 'Flashcards', meta: `${n} cards`, href: `/cards/?topic=${encodeURIComponent(t.id)}` });

  for (const kind of ['past', 'mock'] as const) {
    const refs = t.examRefs.filter((r) => examById[r.exam]?.kind === kind);
    const byExam = new Map<string, string[]>();
    for (const r of refs) byExam.set(r.exam, [...(byExam.get(r.exam) ?? []), ...r.items]);
    if (!byExam.size) continue;
    const examNodes: Node[] = [...byExam].map(([examId, ids]) => {
      const exam = examById[examId];
      const items = examItems(exam).filter((it) => ids.includes(it.id));
      return {
        id: `${t.id}/${examId}`,
        label: exam.title,
        meta: `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        children: items.map((it) => ({
          id: `${t.id}/${examId}/${it.id}`,
          label: `${it.id}  ${shorten(it.prompt)}`,
          meta: `${it.points} pts`,
          href: `/exams/${examId}/#item-${encodeURIComponent(it.id)}`,
          score: best[`${examId}/${it.id}`] ?? null,
        })),
      };
    });
    const total = examNodes.reduce((s, e) => s + (e.children?.length ?? 0), 0);
    children.push({ id: `${t.id}/${kind}`, label: kind === 'past' ? 'Past exam items' : 'Mock exam items', meta: `${total}`, children: examNodes });
  }

  if (t.id === 'tailrec' && DATA.drills.length) {
    children.push({
      id: `${t.id}/drills`,
      label: 'Tail-recursion drills',
      meta: `${Object.keys(drillsDone).length}/${DATA.drills.length} passed`,
      children: DATA.drills.map((d) => ({ id: `drill/${d.id}`, label: d.title, meta: d.group, href: `/problems/#tr-${d.id}`, done: !!drillsDone[d.id] })),
    });
  }

  const lessons = DATA.asm.lessons.filter((l) => (ASM_GROUPS[t.id] ?? []).includes(l.group));
  if (lessons.length) {
    children.push({
      id: `${t.id}/asm`,
      label: 'ASM lessons',
      meta: `${lessons.length}`,
      children: lessons.map((l) => ({ id: `${t.id}/asm/${l.id}`, label: l.title, meta: l.group, href: `/asm/#${l.id}` })),
    });
  }

  if (t.problems.length) {
    children.push({
      id: `${t.id}/problems`,
      label: t.id === 'tailrec' ? 'List warm-ups' : 'Practice problems',
      meta: `${t.problems.filter((p) => solved[p]).length}/${t.problems.length} solved`,
      children: t.problems.map((p) => ({ id: `${t.id}/q${p}`, label: `Q${p}  ${problemTitle[p]}`, href: `/problems/#q${p}`, done: !!solved[p] })),
    });
  }

  const scores = t.examRefs.flatMap((r) => r.items.map((i) => best[`${r.exam}/${i}`])).filter((v): v is number => v != null);
  return {
    id: t.id,
    label: t.title,
    meta: t.guide,
    score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    children,
  };
}

/** Keep nodes whose label matches, plus their ancestors; null if nothing in the subtree matches. */
function filterTree(n: Node, q: string): Node | null {
  const hit = n.label.toLowerCase().includes(q) || (n.meta ?? '').toLowerCase().includes(q);
  const kids = (n.children ?? []).map((c) => filterTree(c, q)).filter((c): c is Node => !!c);
  // Prefer the matching descendants; show a node's whole subtree only when
  // the node itself matches and nothing inside it does.
  if (kids.length) return { ...n, children: kids };
  if (hit) return n;
  return null;
}

// ---------- page ----------

export default function TopicsPage() {
  const mounted = useMounted();
  const [attemptsStored] = useStored<Attempt[]>('attempts', []);
  const [solvedStored] = useStored<Record<string, boolean>>('solved', {});
  const [drillsStored] = useStored<Record<string, boolean>>('drills', {});
  const [openStored, setOpen] = useStored<string[]>('topicTree', ['area/queues', 'tailrec']);
  const [query, setQuery] = useState('');
  const attempts = mounted ? attemptsStored : [];
  const open = new Set(mounted ? openStored : ['area/queues', 'tailrec']);

  const tree: Node[] = useMemo(() => {
    const best: Record<string, number> = {};
    for (const a of attempts) {
      const exam = examById[a.examId];
      if (!exam) continue;
      for (const it of examItems(exam)) {
        const k = `${a.examId}/${it.id}`;
        best[k] = Math.max(best[k] ?? 0, (Number(a.scores[it.id]) || 0) / it.points);
      }
    }
    const solved = mounted ? solvedStored : {};
    const drillsDone = mounted ? drillsStored : {};
    const topicById = Object.fromEntries(DATA.topics.map((t) => [t.id, t]));
    return AREAS.map((a) => ({
      id: `area/${a.id}`,
      label: a.title,
      meta: a.chapters,
      children: a.topics.filter((id) => topicById[id]).map((id) => topicNode(topicById[id], best, solved, drillsDone)),
    }));
  }, [attempts, solvedStored, drillsStored, mounted]);

  const q = query.trim().toLowerCase();
  const shown = q ? tree.map((n) => filterTree(n, q)).filter((n): n is Node => !!n) : tree;
  const isOpen = useCallback((id: string) => !!q || open.has(id), [q, open]);

  // Flat list of visible nodes, for arrow-key navigation.
  const visible: { node: Node; parent: string | null }[] = [];
  const walk = (ns: Node[], parent: string | null) => {
    for (const n of ns) {
      visible.push({ node: n, parent });
      if (n.children?.length && isOpen(n.id)) walk(n.children, n.id);
    }
  };
  walk(shown, null);

  const [focus, setFocus] = useState<string | null>(null);
  const focusId = focus && visible.some((v) => v.node.id === focus) ? focus : visible[0]?.node.id ?? null;
  const treeRef = useRef<HTMLUListElement>(null);
  const moveTo = (id: string) => {
    setFocus(id);
    requestAnimationFrame(() => treeRef.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)?.focus());
  };
  const toggle = (id: string, to?: boolean) =>
    setOpen((prev) => {
      const s = new Set(prev);
      if (to ?? !s.has(id)) s.add(id);
      else s.delete(id);
      return [...s];
    });

  function onKeyDown(e: React.KeyboardEvent) {
    const i = visible.findIndex((v) => v.node.id === focusId);
    if (i < 0) return;
    const { node, parent } = visible[i];
    const hasKids = !!node.children?.length;
    const k = e.key;
    if (k === 'ArrowDown' && i + 1 < visible.length) moveTo(visible[i + 1].node.id);
    else if (k === 'ArrowUp' && i > 0) moveTo(visible[i - 1].node.id);
    else if (k === 'Home') moveTo(visible[0].node.id);
    else if (k === 'End') moveTo(visible[visible.length - 1].node.id);
    else if (k === 'ArrowRight' && hasKids) {
      if (!isOpen(node.id)) toggle(node.id, true);
      else moveTo(node.children![0].id);
    } else if (k === 'ArrowLeft') {
      if (hasKids && isOpen(node.id) && !q) toggle(node.id, false);
      else if (parent) moveTo(parent);
    } else if ((k === 'Enter' || k === ' ') && hasKids && !node.href) toggle(node.id);
    else return;
    e.preventDefault();
  }

  const allBranchIds = useMemo(() => {
    const ids: string[] = [];
    const w = (ns: Node[]) => ns.forEach((n) => { if (n.children?.length) { ids.push(n.id); w(n.children); } });
    w(tree);
    return ids;
  }, [tree]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h1">Topic map</h1>
          <p className="lede">Every topic on the midterm, broken down into its flashcards, the exam items that test it, practice problems and drills. Exam items are shaded by your best saved score.</p>
        </div>
      </header>

      <div className="tree-tools">
        <label className="search">
          <span className="sr-only">Filter the map</span>
          <input type="search" placeholder="Filter: deque, closures, 25fa, Q46…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" className="link-btn" onClick={() => setOpen(allBranchIds)}>Expand all</button>
        <button type="button" className="link-btn" onClick={() => setOpen([])}>Collapse all</button>
        <span className="tree-legend" aria-hidden>
          <span><i className="dot is-full" />full marks</span>
          <span><i className="dot is-part" />partial</span>
          <span><i className="dot is-low" />under half</span>
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="empty">Nothing matches &ldquo;{query}&rdquo;. Try a topic, an exam like 25fa, or a problem number.</p>
      ) : (
        <ul className="tree" role="tree" aria-label="Topic map" ref={treeRef} onKeyDown={onKeyDown}>
          {shown.map((n) => (
            <TreeNode key={n.id} node={n} depth={0} isOpen={isOpen} toggle={toggle} focusId={focusId} setFocus={setFocus} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TreeNode({ node, depth, isOpen, toggle, focusId, setFocus }: {
  node: Node;
  depth: number;
  isOpen: (id: string) => boolean;
  toggle: (id: string, to?: boolean) => void;
  focusId: string | null;
  setFocus: (id: string) => void;
}) {
  const kids = node.children ?? [];
  const branch = kids.length > 0;
  const expanded = branch && isOpen(node.id);
  const tone = node.score == null ? '' : node.score >= 0.999 ? 'is-full' : node.score >= 0.5 ? 'is-part' : 'is-low';
  const common = {
    'data-node': node.id,
    tabIndex: node.id === focusId ? 0 : -1,
    onFocus: () => setFocus(node.id),
    className: `tn-row depth-${Math.min(depth, 3)}`,
  };
  const body = (
    <>
      <span className={`tn-chev ${branch ? '' : 'is-leaf'} ${expanded ? 'is-open' : ''}`} aria-hidden />
      {node.score != null && <i className={`dot ${tone}`} aria-hidden />}
      {node.done && <span className="tn-done" aria-label="done">✓</span>}
      <span className="tn-label">{node.label}</span>
      {node.meta && <span className="tn-meta">{node.meta}</span>}
      {node.score != null && depth <= 2 && <span className="tn-score num">{pct(node.score, 1)}%</span>}
    </>
  );
  return (
    <li role="treeitem" aria-expanded={branch ? expanded : undefined} aria-selected={false} className={`tn ${branch ? 'is-branch' : ''}`}>
      {node.href && !branch ? (
        <Link href={node.href} {...common}>{body}</Link>
      ) : (
        <div role="button" {...common} onClick={() => branch && toggle(node.id)}>{body}</div>
      )}
      {expanded && (
        <ul role="group" className="tn-kids">
          {kids.map((c) => (
            <TreeNode key={c.id} node={c} depth={depth + 1} isOpen={isOpen} toggle={toggle} focusId={focusId} setFocus={setFocus} />
          ))}
        </ul>
      )}
    </li>
  );
}
