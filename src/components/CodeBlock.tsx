'use client';
import { useMemo } from 'react';
import { highlightSegments, looksLikeJava, type Segment } from '@/lib/highlight';

/** Split highlighted segments into lines (segments can span newlines). */
function toLines(segs: Segment[]): Segment[][] {
  const lines: Segment[][] = [[]];
  for (const s of segs) {
    const parts = s.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, cls: s.cls });
    });
  }
  return lines;
}

/** Read-only code with the same colours as the editor. `lines` (1-based) are highlighted. */
export function CodeBlock({ code, lang, wrap = false, className = '', lines, numbered = false }: {
  code: string;
  lang?: 'ocaml' | 'java' | 'text';
  wrap?: boolean;
  className?: string;
  lines?: number[];
  numbered?: boolean;
}) {
  const language = lang ?? (looksLikeJava(code) ? 'java' : 'ocaml');
  const segs = useMemo<Segment[]>(
    () => (language === 'text' ? [{ text: code, cls: '' }] : highlightSegments(code, language)),
    [code, language],
  );
  const render = (ss: Segment[]) => ss.map((s, i) => (s.cls ? <span key={i} className={s.cls}>{s.text}</span> : s.text));

  if (!lines && !numbered) {
    return <pre className={`code ${wrap ? 'is-wrap' : ''} ${className}`}>{render(segs)}</pre>;
  }
  const hl = new Set(lines ?? []);
  return (
    <pre className={`code is-lined ${wrap ? 'is-wrap' : ''} ${className}`}>
      {toLines(segs).map((ln, i) => (
        <span key={i} className={`cl ${hl.has(i + 1) ? 'is-hl' : ''}`}>
          {numbered && <span className="cl-n" aria-hidden>{i + 1}</span>}
          <span className="cl-t">{ln.length ? render(ln) : ' '}</span>
        </span>
      ))}
    </pre>
  );
}
