'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { DATA } from '@/lib/data';
import { fmtDuration } from '@/lib/format';
import { exportProgress, importProgress, useNow, useStored, type Attempt, type CardState } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/cards/', label: 'Flashcards' },
  { href: '/exams/', label: 'Exams' },
  { href: '/asm/', label: 'ASM practice' },
  { href: '/topics/', label: 'Topic map' },
  { href: '/problems/', label: 'Problems' },
];

export function useSection() {
  return useStored<string>('section', '001');
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const now = useNow(30_000);
  const [section, setSection] = useSection();
  const [cards] = useStored<CardState>('cards', {});
  const [attempts] = useStored<Attempt[]>('attempts', []);
  const [solved] = useStored<Record<string, boolean>>('solved', {});
  const fileRef = useRef<HTMLInputElement>(null);

  const slot = DATA.plan.exams.find((e) => e.section === section) ?? DATA.plan.exams[0];
  const left = now == null ? null : new Date(slot.start).getTime() - now;
  const due = now == null ? null : DATA.cards.filter((c) => !cards[c.id] || cards[c.id].due <= now).length;

  const meta: Record<string, string | null> = {
    '/cards/': due == null ? null : `${due} due`,
    '/exams/': attempts.length ? `${attempts.length} done` : null,
    '/problems/': `${Object.keys(solved).length}/${DATA.problems.length}`,
  };
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href.replace(/\/$/, '')));

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <aside className="rail">
        <Link href="/" className="brand">
          <span className="brand-name">Midterm 2</span>
          <span className="brand-sub">CIS 1200, Friday Nov 6</span>
        </Link>

        <nav className="nav" aria-label="Sections">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link" aria-current={active(n.href) ? 'page' : undefined}>
              <span>{n.label}</span>
              {meta[n.href] && <span className="nav-meta">{meta[n.href]}</span>}
            </Link>
          ))}
        </nav>

        <div className="rail-foot">
          <div className={`rail-count ${path === '/' ? 'is-home' : ''}`}>
            {left == null ? ' ' : left > 0 ? (
              <>
                <span className="rail-count-num">{fmtDuration(left)}</span>
                <span className="rail-count-label">until section {slot.section}</span>
              </>
            ) : (
              <span className="rail-count-label">Exam time. Good luck.</span>
            )}
          </div>
          <div className="seg" role="group" aria-label="Your exam section">
            {DATA.plan.exams.map((e) => (
              <button key={e.section} type="button" aria-pressed={e.section === section} onClick={() => setSection(e.section)}>
                {e.section}
              </button>
            ))}
          </div>
          <div className="rail-actions">
            <button type="button" className="link-btn" onClick={exportProgress}>Export progress</button>
            <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>Import</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  await importProgress(f);
                } catch (err) {
                  alert(`Couldn't import: ${(err as Error).message}`);
                }
              }}
            />
          </div>
          <p className="rail-note">Progress is saved in this browser only.</p>
        </div>
      </aside>
      <main id="main" className="main">{children}</main>
    </div>
  );
}
