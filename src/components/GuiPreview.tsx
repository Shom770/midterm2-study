'use client';
import { useEffect, useRef } from 'react';

// Paints the drawing operations recorded by practice/lib/g.ml (OCaml Graphics
// coordinates: origin at the bottom left) and sends mouse and key events back.

type Op =
  | { k: 'L'; c: number; lw: number; x1: number; y1: number; x2: number; y2: number }
  | { k: 'R'; c: number; lw: number; x: number; y: number; w: number; h: number }
  | { k: 'F'; c: number; x: number; y: number; w: number; h: number }
  | { k: 'E'; c: number; lw: number; x: number; y: number; rx: number; ry: number }
  | { k: 'T'; c: number; x: number; y: number; s: string }
  | { k: 'P'; c: number; x: number; y: number };

export type Frame = { w: number; h: number; ops: Op[]; error?: string };

/** Decode an OCaml %S string literal. */
function ocamlString(lit: string): string {
  return lit
    .slice(1, -1)
    .replace(/\\(\d{3}|x[0-9a-fA-F]{2}|.)/g, (_m, e: string) => {
      if (/^\d{3}$/.test(e)) return String.fromCharCode(Number(e));
      if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
      return ({ n: '\n', t: '\t', r: '\r', b: '\b' } as Record<string, string>)[e] ?? e;
    });
}

/** The last complete frame in a chunk of output, or null if there is none. */
export function parseFrame(stdout: string): Frame | null {
  const start = stdout.lastIndexOf('@@GUI ');
  if (start < 0) return null;
  const end = stdout.indexOf('@@END', start);
  const lines = stdout.slice(start, end < 0 ? undefined : end).split('\n');
  const [, w, h] = lines[0].split(' ').map(Number);
  const ops: Op[] = [];
  for (const line of lines.slice(1)) {
    const k = line[0];
    if (k === 'T') {
      const m = line.match(/^T (-?\d+) (-?\d+) (-?\d+) (".*")$/);
      if (m) ops.push({ k: 'T', c: +m[1], x: +m[2], y: +m[3], s: ocamlString(m[4]) });
      continue;
    }
    const n = line.slice(2).split(' ').map(Number);
    if (k === 'L') ops.push({ k, c: n[0], lw: n[1], x1: n[2], y1: n[3], x2: n[4], y2: n[5] });
    else if (k === 'R') ops.push({ k, c: n[0], lw: n[1], x: n[2], y: n[3], w: n[4], h: n[5] });
    else if (k === 'F') ops.push({ k, c: n[0], x: n[1], y: n[2], w: n[3], h: n[4] });
    else if (k === 'E') ops.push({ k, c: n[0], lw: n[1], x: n[2], y: n[3], rx: n[4], ry: n[5] });
    else if (k === 'P') ops.push({ k, c: n[0], x: n[1], y: n[2] });
  }
  const err = stdout.match(/@@ERR (.*)/);
  return { w: w || 1, h: h || 1, ops, error: err?.[1] };
}

// Drawn larger than 1:1 so small widgets are readable; events are scaled back.
const SCALE = 1.5;

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

function paint(ctx: CanvasRenderingContext2D, f: Frame, font: string) {
  const H = f.h;
  const fy = (y: number) => H - 1 - y; // OCaml y (up) to canvas y (down)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, f.w, f.h);
  ctx.textBaseline = 'bottom';
  ctx.font = font;
  for (const o of f.ops) {
    ctx.strokeStyle = ctx.fillStyle = hex(o.c);
    if (o.k === 'L') {
      ctx.lineWidth = o.lw;
      ctx.beginPath();
      ctx.moveTo(o.x1 + 0.5, fy(o.y1) + 0.5);
      ctx.lineTo(o.x2 + 0.5, fy(o.y2) + 0.5);
      ctx.stroke();
    } else if (o.k === 'R') {
      ctx.lineWidth = o.lw;
      ctx.strokeRect(o.x + 0.5, fy(o.y + o.h) + 0.5, o.w, o.h);
    } else if (o.k === 'F') {
      ctx.fillRect(o.x, H - o.y - o.h, o.w, o.h);
    } else if (o.k === 'E') {
      ctx.lineWidth = o.lw;
      ctx.beginPath();
      ctx.ellipse(o.x + 0.5, fy(o.y) + 0.5, Math.max(0, o.rx), Math.max(0, o.ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (o.k === 'T') {
      ctx.fillText(o.s, o.x, fy(o.y) + 1);
    } else if (o.k === 'P') {
      ctx.fillRect(o.x, fy(o.y), 1, 1);
    }
  }
}

export function GuiPreview({ frame, onEvent, hint }: {
  frame: Frame | null;
  onEvent: (kind: string, x: number, y: number) => Promise<void>;
  hint: string | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const down = useRef(false);
  const busy = useRef(false);
  const pending = useRef<[string, number, number] | null>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !frame) return;
    const dpr = window.devicePixelRatio || 1;
    const k = dpr * SCALE;
    c.width = Math.round(frame.w * k);
    c.height = Math.round(frame.h * k);
    c.style.width = `${frame.w * SCALE}px`;
    c.style.height = `${frame.h * SCALE}px`;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const mono = getComputedStyle(document.body).getPropertyValue('--font-mono').trim() || 'monospace';
    paint(ctx, frame, `13.33px ${mono}, monospace`);
  }, [frame]);

  // Drags arrive faster than the toplevel can answer: keep only the latest.
  async function send(kind: string, x: number, y: number) {
    if (busy.current) {
      pending.current = [kind, x, y];
      return;
    }
    busy.current = true;
    await onEvent(kind, x, y);
    busy.current = false;
    const next = pending.current;
    pending.current = null;
    if (next) send(...next);
  }

  const pos = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    // The canvas may also be shrunk by CSS (max-width), so scale by its real size.
    const sx = frame ? frame.w / r.width : 1 / SCALE;
    const sy = frame ? frame.h / r.height : 1 / SCALE;
    return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy] as const;
  };

  return (
    <figure className="gui">
      <figcaption className="fine">Live preview. Click, drag, or focus it and type.</figcaption>
      {frame ? (
        <canvas
          ref={canvas}
          className="gui-canvas"
          tabIndex={0}
          aria-label="Widget preview"
          onPointerDown={(e) => {
            down.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            send('down', ...pos(e));
          }}
          onPointerMove={(e) => {
            if (down.current) send('drag', ...pos(e));
          }}
          onPointerUp={(e) => {
            down.current = false;
            send('up', ...pos(e));
          }}
          onKeyDown={(e) => {
            if (e.key.length === 1 && e.key.charCodeAt(0) < 128) {
              e.preventDefault();
              send(e.key, 0, 0);
            }
          }}
        />
      ) : (
        <div className="gui-empty">{hint}</div>
      )}
      {frame?.error && <p className="fine bad-text">An event raised {frame.error}</p>}
    </figure>
  );
}
