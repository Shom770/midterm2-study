'use client';
import { useId, useMemo } from 'react';
import type { AsmState, Cell, Val } from '@/lib/asm';

// Draws an ASM state as SVG: the stack on the left, heap cells in columns by
// distance from the stack (or where a lesson's `at` hint puts them), arrows for
// references. Mutable fields get the course's double border. Cells and fields
// that changed since `prev` are highlighted.

const CH = 7.4; // px per character at 12.5px mono
const ROW = 30;
const HEAD = 22;
const PAD = 10;
const STACK_W = 156;
const GAP_X = 74;
const GAP_Y = 22;
const VAL_MIN = 44;

const label = (c: Cell) =>
  c.label ?? ({ some: 'Some', cons: 'Cons', ref: 'ref', closure: 'closure', array: 'array', string: 'String' } as Record<string, string>)[c.kind] ?? '';

const valText = (v: Val) => (v.ref !== undefined ? '' : v.lit);
const valW = (v: Val) => Math.max(VAL_MIN, valText(v).length * CH + 18);

type Box = { cell: Cell; x: number; y: number; w: number; h: number; nameW: number; vw: number };

function layout(st: AsmState) {
  const heap = st.heap ?? [];
  const byId = new Map(heap.map((c) => [c.id, c]));
  // Depth = shortest distance from a stack slot.
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const e of st.stack) if (e.value?.ref && byId.has(e.value.ref) && !depth.has(e.value.ref)) { depth.set(e.value.ref, 0); queue.push(e.value.ref); }
  while (queue.length) {
    const id = queue.shift()!;
    for (const f of byId.get(id)!.fields) {
      const r = f.value?.ref;
      if (r && byId.has(r) && !depth.has(r)) { depth.set(r, depth.get(id)! + 1); queue.push(r); }
    }
  }
  for (const c of heap) if (!depth.has(c.id)) depth.set(c.id, 0);

  // Grid placement: explicit hints first, then fill columns top-down.
  const pos = new Map<string, [number, number]>();
  const taken = new Set<string>();
  for (const c of heap) if (c.at) { pos.set(c.id, c.at); taken.add(c.at.join(',')); }
  const order = [...heap].sort((a, b) => depth.get(a.id)! - depth.get(b.id)!);
  for (const c of order) {
    if (pos.has(c.id)) continue;
    const col = depth.get(c.id)!;
    let row = 0;
    while (taken.has(`${col},${row}`)) row++;
    pos.set(c.id, [col, row]);
    taken.add(`${col},${row}`);
  }

  const sizes = new Map(heap.map((c) => {
    const nameW = Math.max(0, ...c.fields.map((f) => (f.name ? f.name.length * CH + 16 : 0)));
    const vw = Math.max(VAL_MIN, ...c.fields.map((f) => valW(f.value)));
    const w = Math.max(nameW + vw, label(c).length * CH + 2 * PAD, 64);
    const h = (label(c) ? HEAD : 0) + Math.max(1, c.fields.length) * ROW;
    return [c.id, { w, h, nameW: w - vw, vw }] as const;
  }));
  const cols = Math.max(0, ...[...pos.values()].map(([c]) => c + 1));
  const colW = Array.from({ length: cols }, (_, i) => Math.max(0, ...heap.filter((c) => pos.get(c.id)![0] === i).map((c) => sizes.get(c.id)!.w)));
  const colX = colW.reduce<number[]>((xs, w, i) => [...xs, i === 0 ? STACK_W + GAP_X : xs[i - 1] + colW[i - 1] + GAP_X], []);
  // Rows: each grid row is as tall as its tallest cell.
  const rows = Math.max(0, ...[...pos.values()].map(([, r]) => r + 1));
  const rowH = Array.from({ length: rows }, (_, i) => Math.max(0, ...heap.filter((c) => pos.get(c.id)![1] === i).map((c) => sizes.get(c.id)!.h)));
  const rowY = rowH.reduce<number[]>((ys, h, i) => [...ys, i === 0 ? 34 : ys[i - 1] + rowH[i - 1] + GAP_Y], []);

  const boxes = new Map<string, Box>();
  for (const c of heap) {
    const [col, row] = pos.get(c.id)!;
    const s = sizes.get(c.id)!;
    boxes.set(c.id, { cell: c, x: colX[col], y: rowY[row], ...s });
  }

  const stackRows = st.stack.map((e, i) => ({ e, y: 34 + i * (ROW + 8) }));
  const width = Math.max(STACK_W + 20, ...[...boxes.values()].map((b) => b.x + b.w + 30));
  const height = Math.max(
    80,
    34 + st.stack.length * (ROW + 8) + 10,
    ...[...boxes.values()].map((b) => b.y + b.h + 30),
  );
  return { boxes, stackRows, width, height };
}

function changedKeys(st: AsmState, prev?: AsmState) {
  const out = new Set<string>();
  if (!prev) return out;
  const show = (v?: Val) => (v ? (v.ref !== undefined ? `@${v.ref}` : v.lit) : '');
  const ps = new Map(prev.stack.filter((e) => e.name).map((e) => [e.name!, show(e.value)]));
  st.stack.forEach((e) => { if (e.name && ps.get(e.name) !== show(e.value)) out.add(`s:${e.name}`); });
  const ph = new Map(prev.heap.map((c) => [c.id, c]));
  for (const c of st.heap) {
    const pc = ph.get(c.id);
    if (!pc) { out.add(`c:${c.id}`); continue; }
    c.fields.forEach((f, i) => { if (show(pc.fields[i]?.value) !== show(f.value)) out.add(`f:${c.id}:${i}`); });
  }
  return out;
}

export function AsmDiagram({ state, prev, compact = false, label: aria }: { state: AsmState; prev?: AsmState; compact?: boolean; label: string }) {
  const uid = useId().replace(/:/g, '');
  const L = useMemo(() => layout(state), [state]);
  const changed = useMemo(() => changedKeys(state, prev), [state, prev]);

  const arrows: { d: string; key: string; hot: boolean }[] = [];
  const target = (ref: string) => L.boxes.get(ref);
  const arrowFrom = (sx: number, sy: number, ref: string, key: string, hot: boolean, selfId?: string) => {
    const t = target(ref);
    if (!t) return;
    const ty = t.y + Math.min(t.h / 2, 15);
    let d: string;
    if (selfId === ref) {
      d = `M${sx},${sy} C${sx + 46},${sy} ${sx + 46},${t.y - 26} ${t.x + t.w / 2},${t.y - 26} S${t.x + 16},${t.y - 22} ${t.x + 16},${t.y}`;
    } else if (t.x > sx + 8) {
      const dx = Math.max(30, (t.x - sx) * 0.5);
      d = `M${sx},${sy} C${sx + dx},${sy} ${t.x - dx},${ty} ${t.x},${ty}`;
    } else {
      // Back edge: leave right, loop round and enter the target from its right side.
      const ex = t.x + t.w;
      const bend = Math.max(36, Math.abs(sy - ty) * 0.25 + 30);
      d = `M${sx},${sy} C${sx + bend},${sy} ${ex + bend},${ty} ${ex},${ty}`;
    }
    arrows.push({ d, key, hot });
  };

  L.stackRows.forEach(({ e, y }) => {
    if (e.value?.ref) arrowFrom(STACK_W - 22, y + ROW / 2, e.value.ref, `s:${e.name}`, changed.has(`s:${e.name}`));
  });
  for (const b of L.boxes.values()) {
    const top = b.y + (label(b.cell) ? HEAD : 0);
    b.cell.fields.forEach((f, i) => {
      if (f.value?.ref) arrowFrom(b.x + b.w - b.vw / 2, top + i * ROW + ROW / 2, f.value.ref, `f:${b.cell.id}:${i}`, changed.has(`f:${b.cell.id}:${i}`), b.cell.id);
    });
  }

  return (
    <svg
      className={`asm ${compact ? 'is-compact' : ''}`}
      viewBox={`0 0 ${L.width} ${L.height}`}
      style={compact ? undefined : { maxWidth: L.width }}
      role="img"
      aria-label={aria}
    >
      <defs>
        <marker id={`ah-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="asm-head" />
        </marker>
        <marker id={`ahh-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="asm-head is-hot" />
        </marker>
      </defs>
      <text x={0} y={16} className="asm-title">Stack</text>
      {L.boxes.size > 0 && <text x={STACK_W + GAP_X} y={16} className="asm-title">Heap</text>}

      {L.stackRows.map(({ e, y }, i) =>
        e.frame ? (
          <g key={`f${i}`}>
            <line x1={0} x2={STACK_W - 8} y1={y + ROW / 2} y2={y + ROW / 2} className="asm-frame-line" />
            <text x={4} y={y + ROW / 2 - 5} className="asm-frame">{e.frame}</text>
          </g>
        ) : (
          <g key={`s${i}`} className={changed.has(`s:${e.name}`) ? 'is-hot' : ''}>
            <rect x={0} y={y} width={STACK_W - 44} height={ROW} className="asm-slot-name" />
            <text x={10} y={y + ROW / 2 + 4} className="asm-name">{e.name}</text>
            <rect x={STACK_W - 44} y={y} width={44} height={ROW} className="asm-slot" />
            {e.value?.ref ? (
              <circle cx={STACK_W - 22} cy={y + ROW / 2} r={3} className="asm-dot" />
            ) : (
              <text x={STACK_W - 22} y={y + ROW / 2 + 4} textAnchor="middle" className="asm-lit">{e.value?.lit}</text>
            )}
          </g>
        ),
      )}

      {[...L.boxes.values()].map((b) => {
        const lab = label(b.cell);
        const top = b.y + (lab ? HEAD : 0);
        const isNew = changed.has(`c:${b.cell.id}`);
        return (
          <g key={b.cell.id} className={`asm-cell kind-${b.cell.kind} ${isNew ? 'is-new' : ''}`}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} className="asm-box" />
            {lab && (
              <>
                <rect x={b.x} y={b.y} width={b.w} height={HEAD} rx={3} className="asm-headbar" />
                <text x={b.x + PAD} y={b.y + 15} className="asm-label">{lab}</text>
              </>
            )}
            {b.cell.fields.map((f, i) => {
              const ry = top + i * ROW;
              const hot = changed.has(`f:${b.cell.id}:${i}`);
              const vx = b.x + b.w - b.vw;
              return (
                <g key={i} className={hot ? 'is-hot' : ''}>
                  {i > 0 && <line x1={b.x} x2={b.x + b.w} y1={ry} y2={ry} className="asm-rule" />}
                  {f.name && <text x={b.x + 8} y={ry + ROW / 2 + 4} className="asm-name">{f.name}</text>}
                  <rect x={vx + 4} y={ry + 4} width={b.vw - 8} height={ROW - 8} rx={2} className={`asm-val ${f.mutable ? 'is-mutable' : ''}`} />
                  {f.mutable && <rect x={vx + 7} y={ry + 7} width={b.vw - 14} height={ROW - 14} rx={1} className="asm-val-inner" />}
                  {f.value?.ref ? (
                    <circle cx={vx + b.vw / 2} cy={ry + ROW / 2} r={3} className="asm-dot" />
                  ) : (
                    <text x={vx + b.vw / 2} y={ry + ROW / 2 + 4} textAnchor="middle" className="asm-lit">{f.value?.lit}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {arrows.map((a) => (
        <path key={a.key} d={a.d} className={`asm-arrow ${a.hot ? 'is-hot' : ''}`} markerEnd={`url(#${a.hot ? 'ahh' : 'ah'}-${uid})`} />
      ))}
    </svg>
  );
}
