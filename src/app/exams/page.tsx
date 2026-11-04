'use client';
import Link from 'next/link';
import { DATA, examById, examItems, type Exam } from '@/lib/data';
import { fmtClock, pct } from '@/lib/format';
import { useMounted, useStored, type Attempt } from '@/lib/store';

const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function ExamsPage() {
  const mounted = useMounted();
  const [stored, setAttempts] = useStored<Attempt[]>('attempts', []);
  const attempts = mounted ? stored : [];
  const mocks = DATA.exams.filter((e) => e.kind === 'mock');
  const past = DATA.exams.filter((e) => e.kind === 'past');

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="h1">Exams</h1>
          <p className="lede">Run one under the clock, reveal the keys when you&rsquo;re done, then score each item. Saved scores feed the weakest-topics list on Today.</p>
        </div>
      </header>

      {mocks.length > 0 && <ExamGroup title="Mock exams" note="Written in the style of the real ones, with new questions." exams={mocks} attempts={attempts} />}
      <ExamGroup title="Past exams" note="Keys checked against the official solutions. The PDFs open the original papers." exams={past} attempts={attempts} />

      {attempts.length > 0 && (
        <section className="block">
          <h2 className="h2">Your attempts</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Exam</th>
                  <th scope="col">Finished</th>
                  <th scope="col" className="r">Score</th>
                  <th scope="col" className="r">Time used</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice().reverse().map((a) => (
                  <tr key={a.id}>
                    <td>{examById[a.examId]?.title ?? a.examId}</td>
                    <td className="dim">{new Date(a.finishedAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="r num">{a.score}/{a.total} <span className="dim">({pct(a.score, a.total)}%)</span></td>
                    <td className="r num dim">{fmtClock(a.elapsedMs)} of {a.minutes}:00</td>
                    <td className="r">
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => {
                          if (confirm('Delete this attempt?')) setAttempts((prev) => prev.filter((x) => x.id !== a.id));
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function ExamGroup({ title, note, exams, attempts }: { title: string; note: string; exams: Exam[]; attempts: Attempt[] }) {
  return (
    <section className="block">
      <div className="block-head">
        <h2 className="h2">{title}</h2>
        <p className="fine">{note}</p>
      </div>
      <ul className="exam-list">
        {exams.map((e) => {
          const mine = attempts.filter((a) => a.examId === e.id);
          const best = mine.length ? Math.max(...mine.map((a) => a.score)) : null;
          const unkeyed = examItems(e).filter((i) => i.keyStatus === 'none').length;
          return (
            <li key={e.id} className="exam-row">
              <div className="exam-main">
                <Link href={`/exams/${e.id}/`} className="exam-title">{e.title}</Link>
                <p className="exam-sub">
                  {e.kind === 'mock' ? e.blurb : [e.instructors, e.date && fmtDate(e.date)].filter(Boolean).join(', ')}
                </p>
                {e.kind === 'past' && (e.pdfs.blank || e.pdfs.solutions) && (
                  <p className="exam-pdfs">
                    {e.pdfs.blank && <a href={e.pdfs.blank} target="_blank" rel="noreferrer">Exam PDF</a>}
                    {e.pdfs.solutions && <a href={e.pdfs.solutions} target="_blank" rel="noreferrer">Solutions PDF</a>}
                  </p>
                )}
              </div>
              <dl className="exam-facts">
                <div><dt>Points</dt><dd className="num">{e.points}</dd></div>
                <div><dt>Minutes</dt><dd className="num">{e.minutes}</dd></div>
                <div>
                  <dt>Best</dt>
                  <dd className="num">{best == null ? <span className="dim">none yet</span> : `${pct(best, e.points)}%`}</dd>
                </div>
              </dl>
              <div className="exam-go">
                <Link className="btn" href={`/exams/${e.id}/`}>{mine.length ? 'Take again' : 'Open'}</Link>
                {unkeyed > 0 && <span className="tag warn">{unkeyed} without a key</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
