'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSection } from '@/components/Shell';
import { DATA, examById, itemTopics, topicById } from '@/lib/data';
import { pad2, pct, plural, splitDuration, todayKey } from '@/lib/format';
import { useNow, useStored, type Attempt, type CardState } from '@/lib/store';

const fmtStart = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

export default function TodayPage() {
  const now = useNow(1000);
  const [section] = useSection();
  const slot = DATA.plan.exams.find((e) => e.section === section) ?? DATA.plan.exams[0];
  const left = now == null ? null : new Date(slot.start).getTime() - now;
  const parts = splitDuration(left ?? 0);

  return (
    <div className="page today">
      <header className="hero">
        <p className="hero-lede">
          {slot.label}. Starts {fmtStart(slot.start)} ET.
        </p>
        <div className="countdown" role="timer" aria-live="off" aria-label="Time until your exam">
          {(
            [
              ['d', 'days'],
              ['h', 'hours'],
              ['m', 'minutes'],
              ['s', 'seconds'],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className={`cd-unit cd-${k}`}>
              <span className="cd-num">{left == null ? '--' : pad2(parts[k])}</span>
              <span className="cd-label">{label}</span>
            </div>
          ))}
        </div>
        {left != null && left <= 0 && <p className="hero-done">It&rsquo;s exam time. Read every question once before you start writing.</p>}
      </header>

      <PlanStrip now={now} />

      <div className="cols">
        <Readiness now={now} />
        <section className="panel">
          <h2 className="h2">Exam-day checklist</h2>
          <ul className="ticks">
            {DATA.plan.examDay.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <h2 className="h2 spaced">If you only have time for the minimum</h2>
          <ul className="ticks">
            {DATA.plan.minimum.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <p className="fine">P, D, G and J numbers refer to drills in your study guide.</p>
        </section>
      </div>
    </div>
  );
}

function PlanStrip({ now }: { now: number | null }) {
  const [done, setDone] = useStored<Record<string, boolean>>('plan', {});
  const today = now == null ? null : todayKey(now);
  const days = DATA.plan.days;
  const defaultDay =
    today == null ? days[0].date : (days.find((d) => d.date === today) ?? days.find((d) => d.date > today) ?? days[days.length - 1]).date;
  const [picked, setPicked] = useState<string | null>(null);
  const sel = days.find((d) => d.date === (picked ?? defaultDay)) ?? days[0];
  const selHours = sel.tasks.reduce((s, t) => s + t.hours, 0);
  const selDone = sel.tasks.filter((t) => done[t.id]).length;

  return (
    <section className="plan" aria-labelledby="plan-title">
      <div className="plan-head">
        <h2 id="plan-title" className="h2">Study plan</h2>
        <span className="fine">
          {Object.values(done).filter(Boolean).length} of {days.reduce((n, d) => n + d.tasks.length, 0)} tasks done
        </span>
      </div>
      <div className="strip" role="tablist" aria-label="Plan days">
        {days.map((d) => {
          const n = d.tasks.filter((t) => done[t.id]).length;
          const state = today == null ? '' : d.date === today ? 'is-today' : d.date < today ? 'is-past' : '';
          const [wk, ...rest] = d.label.split(' ');
          return (
            <button
              key={d.date}
              role="tab"
              type="button"
              aria-selected={d.date === sel.date}
              className={`day ${state}`}
              onClick={() => setPicked(d.date)}
            >
              <span className="day-wk">{d.date === today ? 'Today' : wk}</span>
              <span className="day-date">{rest.join(' ')}</span>
              <span className="day-bar" aria-hidden>
                <i style={{ width: `${pct(n, d.tasks.length)}%` }} />
              </span>
              <span className="day-count">{n}/{d.tasks.length}</span>
            </button>
          );
        })}
      </div>
      <div className="tasks" role="tabpanel">
        <div className="tasks-head">
          <h3 className="h3">{sel.label}</h3>
          <span className="fine">{selDone}/{sel.tasks.length} done, about {selHours.toFixed(1)} hours</span>
        </div>
        <ul className="checklist">
          {sel.tasks.map((t) => (
            <li key={t.id}>
              <label className={done[t.id] ? 'is-done' : ''}>
                <input
                  type="checkbox"
                  checked={!!done[t.id]}
                  onChange={(e) =>
                    setDone((prev) => {
                      const next = { ...prev };
                      if (e.target.checked) next[t.id] = true;
                      else delete next[t.id];
                      return next;
                    })
                  }
                />
                <span className="task-text">{t.text}</span>
                <span className="task-hrs">{t.hours < 1 ? `${Math.round(t.hours * 60)} min` : `${t.hours} h`}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Readiness({ now }: { now: number | null }) {
  const [cards] = useStored<CardState>('cards', {});
  const [attempts] = useStored<Attempt[]>('attempts', []);
  const total = DATA.cards.length;
  const due = now == null ? 0 : DATA.cards.filter((c) => !cards[c.id] || cards[c.id].due <= now).length;
  const seen = DATA.cards.filter((c) => cards[c.id]).length;
  const strong = DATA.cards.filter((c) => (cards[c.id]?.box ?? 0) >= 4).length;

  // Points earned per topic across every saved attempt.
  const byTopic: Record<string, { got: number; of: number }> = {};
  for (const a of attempts) {
    const exam = examById[a.examId];
    if (!exam) continue;
    for (const s of exam.sections) {
      for (const it of s.items) {
        for (const t of itemTopics[`${exam.id}/${it.id}`] ?? []) {
          const b = (byTopic[t] ??= { got: 0, of: 0 });
          b.got += Number(a.scores[it.id]) || 0;
          b.of += it.points;
        }
      }
    }
  }
  const weakest = Object.entries(byTopic)
    .filter(([, v]) => v.of > 0)
    .sort((a, b) => a[1].got / a[1].of - b[1].got / b[1].of)
    .slice(0, 4);
  const recent = attempts.slice(-3).reverse();
  const nextExam = DATA.exams.find((e) => !attempts.some((a) => a.examId === e.id));

  return (
    <section className="panel readiness">
      <h2 className="h2">Where you stand</h2>

      <div className="stat-row">
        <div>
          <div className="stat">{due}</div>
          <div className="stat-label">{due === 1 ? 'card due now' : 'cards due now'}</div>
        </div>
        <div>
          <div className="stat">{strong}<span className="stat-of">/{total}</span></div>
          <div className="stat-label">cards in box 4 or 5</div>
        </div>
        <Link className="btn" href="/cards/">{due ? 'Review due cards' : 'Study ahead'}</Link>
      </div>
      <div className="meter" aria-hidden>
        <i className="m-strong" style={{ width: `${pct(strong, total)}%` }} />
        <i className="m-seen" style={{ width: `${pct(seen - strong, total)}%` }} />
      </div>
      <p className="fine">{seen} of {total} cards seen at least once.</p>

      <h3 className="h3 spaced">Timed exams</h3>
      {recent.length ? (
        <ul className="scores">
          {recent.map((a) => (
            <li key={a.id}>
              <Link href={`/exams/${a.examId}/`}>{examById[a.examId]?.title ?? a.examId}</Link>
              <span className="score-bar" aria-hidden><i style={{ width: `${pct(a.score, a.total)}%` }} /></span>
              <span className="num">{pct(a.score, a.total)}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No exams taken yet. A full timed run tells you more than any number of flashcards.</p>
      )}
      {nextExam && (
        <Link className="btn ghost" href={`/exams/${nextExam.id}/`}>Start {nextExam.title}</Link>
      )}

      {weakest.length > 0 && (
        <>
          <h3 className="h3 spaced">Weakest topics on your exams</h3>
          <ul className="scores">
            {weakest.map(([t, v]) => (
              <li key={t}>
                <Link href={`/cards/?topic=${encodeURIComponent(t)}`}>{topicById[t]?.title ?? t}</Link>
                <span className="score-bar" aria-hidden><i className="is-low" style={{ width: `${pct(v.got, v.of)}%` }} /></span>
                <span className="num">{pct(v.got, v.of)}%</span>
              </li>
            ))}
          </ul>
          <p className="fine">From {plural(attempts.length, 'saved attempt')}. Each link opens that topic&rsquo;s flashcards.</p>
        </>
      )}
    </section>
  );
}
