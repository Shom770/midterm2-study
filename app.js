// Midterm 2 Arena: flashcards, timed past exams, topic map, problem bank and
// study plan. Everything runs offline from js/data.js; progress lives in
// localStorage under versioned m2arena.v1.* keys.
'use strict';

const DATA = window.M2_DATA;
const PREFIX = 'm2arena.v1.';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const view = $('#view');

// ---------- storage ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}
function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

// ---------- helpers ----------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtClock(ms) {
  const neg = ms < 0;
  const t = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${neg ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtDuration(ms) {
  if (ms <= 0) return 'now';
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m` : `${m}m`;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const topicById = Object.fromEntries(DATA.topics.map((t) => [t.id, t]));
const examById = Object.fromEntries(DATA.exams.map((e) => [e.id, e]));
const CARD_TOPIC_NAMES = {
  shapes: 'Question shapes', options: 'Options', unit: 'Unit and sequencing', records: 'Records',
  mutability: 'Mutability and aliasing', asm: 'OCaml ASM, == vs =', queues: 'Queues', tailrec: 'Tail recursion',
  deques: 'Deques', testing: 'Property-based tests', closures: 'Closures', gui: 'GUI library',
  java: 'Java basics', arrays: 'Java arrays', encapsulation: 'Encapsulation', traps: 'Exam traps',
};
const cardTopicName = (t) => CARD_TOPIC_NAMES[t] || t;
const KEY_STATUS = {
  'from-guide': ['From your study guide', 'good'],
  derived: ['Worked out by hand: double-check it', 'warn'],
  none: ['No key recorded', 'bad'],
};

// ---------- countdown ----------
function examSection() {
  return load('section', '001');
}
function examStart() {
  const ex = DATA.plan.exams.find((e) => e.section === examSection()) || DATA.plan.exams[0];
  return { ...ex, at: new Date(ex.start).getTime() };
}
function renderMiniCountdown() {
  const ex = examStart();
  const left = ex.at - Date.now();
  $('#countdown-mini').innerHTML = left > 0
    ? `Exam (${esc(ex.section)}) in <strong>${fmtDuration(left)}</strong>`
    : 'Exam time. Good luck!';
}

// ---------- routing ----------
const TABS = { today: renderToday, cards: renderCards, exams: renderExams, topics: renderTopics, problems: renderProblems };
let cleanup = null;

function route() {
  const [tab, ...rest] = (location.hash.slice(1) || 'today').split('/');
  const fn = TABS[tab] || renderToday;
  $$('.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (TABS[tab] ? tab : 'today')));
  if (cleanup) cleanup();
  cleanup = null;
  view.innerHTML = '';
  fn(rest.map(decodeURIComponent));
  window.scrollTo(0, 0);
}

// ================= Today =================
function renderToday() {
  const now = Date.now();
  const sec = examSection();
  const done = load('plan', {});
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const due = cardsDue(null).length;
  const attempts = load('attempts', []);

  view.innerHTML = `
    <div class="stack">
      <h1>Midterm 2: Friday, November 6</h1>
      <div class="count-big">
        ${DATA.plan.exams.map((e) => {
          const left = new Date(e.start).getTime() - now;
          return `<div class="card ${e.section === sec ? 'mine' : ''}">
            <span class="muted small">${esc(e.label)}</span>
            <span class="num" data-start="${esc(e.start)}">${left > 0 ? fmtDuration(left) : 'Started'}</span>
            <span class="small">${new Date(e.start).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} ET ·
              ${e.section === sec ? '<strong>your section</strong>' : `<button class="btn small ghost" data-section="${esc(e.section)}">This is my section</button>`}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="grid2">
        <div class="card stack">
          <h2>Right now</h2>
          <div class="row"><span class="pill ${due ? 'warn' : 'good'}">${due} flashcards due</span><a class="btn small" href="#cards">Review</a></div>
          <div class="row"><span class="pill accent">${attempts.length} exam attempt${attempts.length === 1 ? '' : 's'} saved</span><a class="btn small" href="#exams">Exams</a></div>
          <div>
            <h3>Exam-day checklist</h3>
            <ul class="plain">${DATA.plan.examDay.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="card">
          <h2>Minimum plan (≈8.5h)</h2>
          <ul class="plain">${DATA.plan.minimum.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <p class="muted small">P/D/G/J numbers refer to the drills in your study guide.</p>
        </div>
      </div>
      <div class="card stack">
        <h2>Study plan</h2>
        ${DATA.plan.days.map((d) => {
          const cls = d.date === todayKey ? 'today' : d.date < todayKey ? 'past' : '';
          const hours = d.tasks.reduce((s, t) => s + t.hours, 0);
          return `<div class="day ${cls}">
            <h3>${esc(d.label)}${d.date === todayKey ? ' · today' : ''} <span class="muted small">${hours.toFixed(1)}h</span></h3>
            ${d.tasks.map((t) => `<label class="task ${done[t.id] ? 'done' : ''}">
              <input type="checkbox" data-task="${esc(t.id)}" ${done[t.id] ? 'checked' : ''}>
              <span>${esc(t.text)}</span><span class="hrs">${t.hours}h</span></label>`).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>`;

  $$('[data-task]', view).forEach((box) => (box.onchange = () => {
    const state = load('plan', {});
    if (box.checked) state[box.dataset.task] = true;
    else delete state[box.dataset.task];
    save('plan', state);
    box.closest('.task').classList.toggle('done', box.checked);
  }));
  $$('[data-section]', view).forEach((b) => (b.onclick = () => {
    save('section', b.dataset.section);
    renderMiniCountdown();
    route();
  }));
  const timer = setInterval(() => {
    $$('[data-start]', view).forEach((el) => {
      const left = new Date(el.dataset.start).getTime() - Date.now();
      el.textContent = left > 0 ? fmtDuration(left) : 'Started';
    });
  }, 30000);
  cleanup = () => clearInterval(timer);
}

// ================= Flashcards (Leitner) =================
// Box 1 is always due. A right answer moves a card up a box and schedules it
// later; a miss sends it back to box 1 and shows it again this session.
const BOX_DELAY = [0, 0, 10 * 60e3, 60 * 60e3, 8 * 3600e3, 24 * 3600e3];
const MAX_BOX = 5;

function cardState() {
  return load('cards', {});
}
function cardsIn(topic) {
  return DATA.cards.filter((c) => !topic || c.topic === topic || (topicById[topic] && topicById[topic].cardTopics.includes(c.topic)));
}
function cardsDue(topic) {
  const st = cardState();
  const now = Date.now();
  return cardsIn(topic).filter((c) => !st[c.id] || st[c.id].due <= now);
}

function renderCards([topic = '']) {
  let queue = [];
  let current = null;
  let revealed = false;
  let studyAhead = false;

  const topics = [...new Set(DATA.cards.map((c) => c.topic))];
  view.innerHTML = `
    <div class="fc-wrap">
      <div class="stack">
        <div class="row">
          <h1>Flashcards</h1>
          <select id="fc-topic" aria-label="Topic">
            <option value="">All topics (${DATA.cards.length})</option>
            ${topics.map((t) => `<option value="${esc(t)}">${esc(cardTopicName(t))} (${cardsIn(t).length})</option>`).join('')}
          </select>
          <span id="fc-due" class="pill"></span>
        </div>
        <div id="fc-card" class="card flash"></div>
        <p class="muted small">Keys: <kbd>Space</kbd> reveal · <kbd>K</kbd> or <kbd>→</kbd> knew it · <kbd>J</kbd> or <kbd>←</kbd> missed it</p>
      </div>
      <aside class="card stack">
        <h3>Progress</h3>
        <div id="fc-progress" class="boxes"></div>
        <div id="fc-topics" class="topic-stats"></div>
        <button id="fc-reset" class="btn small ghost">Reset flashcard progress</button>
      </aside>
    </div>`;

  const sel = $('#fc-topic');
  if (topic && !topics.includes(topic) && topicById[topic]) {
    sel.insertAdjacentHTML('afterbegin', `<option value="${esc(topic)}">${esc(topicById[topic].title)} (${cardsIn(topic).length})</option>`);
  }
  sel.value = topic;
  sel.onchange = () => (location.hash = sel.value ? `#cards/${encodeURIComponent(sel.value)}` : '#cards');

  function buildQueue() {
    const st = cardState();
    const pool = studyAhead ? cardsIn(topic) : cardsDue(topic);
    // Lowest box first, shuffled within a box; new cards count as box 1.
    queue = shuffle(pool.slice()).sort((a, b) => (st[a.id]?.box || 1) - (st[b.id]?.box || 1));
  }

  function next() {
    current = queue.shift() || null;
    revealed = false;
    draw();
  }

  function answer(knew) {
    if (!current || !revealed) return;
    const st = cardState();
    const s = st[current.id] || { box: 1, right: 0, wrong: 0 };
    if (knew) {
      s.box = Math.min(MAX_BOX, s.box + 1);
      s.right++;
    } else {
      s.box = 1;
      s.wrong++;
      // See it again in a few cards.
      queue.splice(Math.min(queue.length, 3 + Math.floor(Math.random() * 3)), 0, current);
    }
    s.due = Date.now() + BOX_DELAY[s.box];
    st[current.id] = s;
    save('cards', st);
    next();
  }

  function draw() {
    const st = cardState();
    const dueNow = cardsDue(topic).length;
    $('#fc-due').textContent = `${dueNow} due`;
    $('#fc-due').className = `pill ${dueNow ? 'warn' : 'good'}`;
    const el = $('#fc-card');
    if (!current) {
      const all = cardsIn(topic);
      const soonest = all.map((c) => st[c.id]?.due || 0).filter((d) => d > Date.now()).sort((a, b) => a - b)[0];
      el.innerHTML = `<div class="front">Nothing due ${topic ? 'in this topic ' : ''}right now.</div>
        <div class="muted">${soonest ? `Next card comes due in ${fmtDuration(soonest - Date.now())}.` : ''} You can keep going anyway.</div>
        <div class="actions"><button id="fc-ahead" class="btn primary">Study ahead (${all.length} cards)</button></div>`;
      $('#fc-ahead').onclick = () => {
        studyAhead = true;
        buildQueue();
        next();
      };
    } else {
      const s = st[current.id];
      const code = /\n/.test(current.back);
      el.innerHTML = `
        <div class="row"><span class="pill accent">${esc(cardTopicName(current.topic))}</span>
          <span class="pill">${s ? `box ${s.box}` : 'new'}</span><span class="muted small">${queue.length} more in this session</span></div>
        <div class="stack">
          <div class="front">${esc(current.front)}</div>
          ${revealed ? `<div class="back ${code ? 'code' : ''}">${esc(current.back)}</div>` : ''}
        </div>
        <div class="actions">${revealed
          ? '<button id="fc-miss" class="btn bad">Missed it</button><button id="fc-knew" class="btn good">Knew it</button>'
          : '<button id="fc-reveal" class="btn primary">Reveal answer</button>'}</div>`;
      const r = $('#fc-reveal');
      if (r) r.onclick = () => { revealed = true; draw(); };
      const k = $('#fc-knew');
      if (k) k.onclick = () => answer(true);
      const m = $('#fc-miss');
      if (m) m.onclick = () => answer(false);
    }
    drawProgress();
  }

  function drawProgress() {
    const st = cardState();
    const pool = cardsIn(topic);
    const counts = [0, 0, 0, 0, 0, 0];
    pool.forEach((c) => counts[st[c.id]?.box || 0]++);
    const names = ['new', 'box 1', 'box 2', 'box 3', 'box 4', 'box 5'];
    const colors = ['#c9c5ba', '#d9534f', '#e8a33d', '#d6c93f', '#7cb85c', '#2e8b57'];
    const mastered = counts[4] + counts[5];
    $('#fc-progress').innerHTML = `
      <div class="small"><strong>${mastered}</strong> of ${pool.length} in box 4+ ${topic ? '(this topic)' : ''}</div>
      <div class="boxbar">${counts.map((n, i) => (n ? `<i class="b${i}" style="width:${(100 * n) / pool.length}%" title="${names[i]}: ${n}"></i>` : '')).join('')}</div>
      <div class="legend">${counts.map((n, i) => `<span style="--c:${colors[i]}">${names[i]} ${n}</span>`).join('')}</div>`;
    $('#fc-topics').innerHTML = topics.map((t) => {
      const cs = cardsIn(t);
      const up = cs.filter((c) => (st[c.id]?.box || 0) >= 4).length;
      return `<div><a href="#cards/${encodeURIComponent(t)}">${esc(cardTopicName(t))}</a>
        <div class="boxbar" title="${up}/${cs.length} in box 4+"><i class="b5" style="width:${(100 * up) / cs.length}%"></i></div></div>`;
    }).join('');
  }

  $('#fc-reset').onclick = () => {
    if (!confirm('Reset all flashcard progress? This cannot be undone.')) return;
    remove('cards');
    studyAhead = false;
    buildQueue();
    next();
  };

  const onKey = (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === ' ' && current && !revealed) {
      e.preventDefault();
      revealed = true;
      draw();
    } else if ((e.key === 'k' || e.key === 'ArrowRight') && revealed) answer(true);
    else if ((e.key === 'j' || e.key === 'ArrowLeft') && revealed) answer(false);
  };
  document.addEventListener('keydown', onKey);
  cleanup = () => document.removeEventListener('keydown', onKey);

  buildQueue();
  next();
}

// ================= Exams =================
function renderExams([examId, itemId]) {
  if (examId && examById[examId]) return renderExam(examById[examId], itemId);
  const attempts = load('attempts', []);
  view.innerHTML = `
    <div class="stack">
      <h1>Timed exams</h1>
      <p class="muted">Pick an exam and start the timer. Keys stay hidden until you reveal them; then score yourself item by item.</p>
      <div class="exam-list">
        ${DATA.exams.map((e) => {
          const mine = attempts.filter((a) => a.examId === e.id);
          const best = mine.reduce((b, a) => Math.max(b, a.score), -1);
          const nokey = e.sections.flatMap((s) => s.items).filter((i) => i.keyStatus === 'none').length;
          return `<div class="card">
            <h2>${esc(e.title)}</h2>
            <span class="muted small">${[e.instructors, e.date].filter(Boolean).map(esc).join(' · ')}</span>
            <div class="row"><span class="pill accent">${e.points} pts</span><span class="pill">${e.minutes} min</span>
              ${nokey ? `<span class="pill bad">${nokey} item${nokey > 1 ? 's' : ''} without key</span>` : ''}</div>
            <div class="small">${mine.length ? `${mine.length} attempt${mine.length > 1 ? 's' : ''} · best ${best}/${e.points}` : 'Not attempted yet'}</div>
            <a class="btn primary" href="#exams/${e.id}">Open</a>
          </div>`;
        }).join('')}
        ${examById.mock ? '' : `<div class="card">
          <h2>Study guide mock exam</h2>
          <span class="muted small">120 pts · 60 min</span>
          <p class="small">Not built yet: it needs the study guide text. Save it as <code>source/study-guide.md</code>, then generate <code>data/exams/mock.json</code> and rerun <code>python3 scripts/build_data.py</code>.</p>
        </div>`}
      </div>
      ${attempts.length ? `<div class="card">
        <h2>All attempts</h2>
        <table class="attempts"><thead><tr><th>Exam</th><th>Date</th><th>Score</th><th>Time used</th><th></th></tr></thead><tbody>
        ${attempts.slice().reverse().map((a) => `<tr><td>${esc(examById[a.examId]?.title || a.examId)}</td>
          <td>${new Date(a.finishedAt).toLocaleString()}</td><td><strong>${a.score}</strong>/${a.total} (${Math.round((100 * a.score) / a.total)}%)</td>
          <td>${fmtClock(a.elapsedMs)} of ${a.minutes}:00</td><td><button class="btn small ghost" data-del="${esc(a.id)}">Delete</button></td></tr>`).join('')}
        </tbody></table></div>` : ''}
    </div>`;
  $$('[data-del]', view).forEach((b) => (b.onclick = () => {
    if (!confirm('Delete this attempt?')) return;
    save('attempts', load('attempts', []).filter((a) => a.id !== b.dataset.del));
    route();
  }));
}

// The in-progress attempt for an exam, kept across reloads.
function getRun(exam) {
  return load(`run.${exam.id}`, null) || { minutes: exam.minutes, elapsedMs: 0, runningSince: null, revealed: {}, scores: {} };
}
function elapsed(run) {
  return run.elapsedMs + (run.runningSince ? Date.now() - run.runningSince : 0);
}

function renderExam(exam, focusId) {
  let run = getRun(exam);
  const items = exam.sections.flatMap((s) => s.items);
  const putRun = () => save(`run.${exam.id}`, run);

  view.innerHTML = `
    <div class="stack">
      <div class="row"><a href="#exams" class="btn small ghost">← All exams</a><h1>${esc(exam.title)}</h1>
        <span class="pill accent">${exam.points} pts</span></div>
      ${exam.notes ? `<p class="muted small">${esc(exam.notes)}</p>` : ''}
      <div class="timerbar">
        <span id="clock" class="clock"></span>
        <button id="t-start" class="btn primary"></button>
        <button id="t-reset" class="btn ghost">Reset</button>
        <label class="small">Timer <input id="t-min" type="number" min="1" max="240" value="${run.minutes}"> min</label>
        ${exam.points <= 60 ? '<button id="t-half" class="btn small ghost">Use 30 min (scaled)</button>' : ''}
        <span class="score-total" id="total"></span>
        <button id="finish" class="btn good">Finish and save</button>
      </div>
      <div id="timesup" class="timesup hidden">Time's up. Finish the item you're on, then score yourself.</div>
      ${exam.sections.map((s) => `
        <div class="section-head"><h2>${esc(s.id)}. ${esc(s.title)}</h2><span class="muted">${s.points} pts</span></div>
        ${s.items.map((it) => itemHtml(exam, it, run)).join('')}`).join('')}
      <div class="row"><button id="finish2" class="btn good">Finish and save</button><button id="discard" class="btn ghost">Discard this attempt</button></div>
    </div>`;

  function itemHtml(exam, it) {
    return `<div class="card item" id="item-${esc(it.id)}">
      <div class="item-head"><strong>${esc(it.id)}</strong><span class="pill">${it.points} pts</span>
        ${it.shape ? `<span class="pill accent">${esc(it.shape)}</span>` : ''}
        <span class="budget muted small" data-budget="${it.points}"></span></div>
      <div>${esc(it.prompt)}</div>
      ${it.code ? `<pre>${esc(it.code)}</pre>` : ''}
      <div class="row">
        <button class="btn small" data-reveal="${esc(it.id)}"></button>
        <span class="scorebox"><label class="small">Score <input type="number" min="0" max="${it.points}" step="0.5" data-score="${esc(it.id)}"></label><span class="muted small">/ ${it.points}</span></span>
      </div>
      <div class="key hidden" data-key="${esc(it.id)}"></div>
    </div>`;
  }

  function keyHtml(it) {
    const [label, cls] = KEY_STATUS[it.keyStatus] || KEY_STATUS.none;
    const body = it.keyStatus === 'none' || !it.key
      ? '<div class="nokey">No key recorded: grade against the official solutions on the course website.</div>'
      : `<pre class="${/\n/.test(it.key) ? '' : 'wrap'}">${esc(it.key)}</pre>`;
    return `<span class="pill ${cls}">${label}</span>${body}
      ${it.notes ? `<details><summary>Notes (unverified)</summary><pre class="wrap">${esc(it.notes)}</pre></details>` : ''}`;
  }

  function drawItems() {
    items.forEach((it) => {
      const shown = !!run.revealed[it.id];
      const btn = $(`[data-reveal="${CSS.escape(it.id)}"]`, view);
      btn.textContent = shown ? 'Hide key' : 'Reveal key';
      const box = $(`[data-key="${CSS.escape(it.id)}"]`, view);
      box.classList.toggle('hidden', !shown);
      box.innerHTML = shown ? keyHtml(it) : '';
      const input = $(`[data-score="${CSS.escape(it.id)}"]`, view);
      if (document.activeElement !== input) input.value = run.scores[it.id] ?? '';
    });
    const total = items.reduce((s, it) => s + (Number(run.scores[it.id]) || 0), 0);
    const scored = items.filter((it) => run.scores[it.id] != null && run.scores[it.id] !== '').length;
    $('#total').textContent = `${total} / ${exam.points}${scored < items.length ? ` · ${items.length - scored} unscored` : ''}`;
    const perPoint = (run.minutes || exam.minutes) / exam.points;
    $$('[data-budget]', view).forEach((el) => (el.textContent = `≈ ${Math.max(1, Math.round(Number(el.dataset.budget) * perPoint))} min`));
  }

  function tick() {
    const left = run.minutes * 60e3 - elapsed(run);
    const clock = $('#clock');
    clock.textContent = fmtClock(left);
    clock.className = `clock ${left < 0 ? 'over' : left < 5 * 60e3 ? 'low' : ''}`;
    $('#timesup').classList.toggle('hidden', left > 0);
    $('#t-start').textContent = run.runningSince ? 'Pause' : elapsed(run) > 0 ? 'Resume' : 'Start';
  }

  $('#t-start').onclick = () => {
    if (run.runningSince) {
      run.elapsedMs = elapsed(run);
      run.runningSince = null;
    } else {
      run.runningSince = Date.now();
    }
    putRun();
    tick();
  };
  $('#t-reset').onclick = () => {
    if (elapsed(run) > 0 && !confirm('Reset the timer to the full time?')) return;
    run.elapsedMs = 0;
    run.runningSince = null;
    putRun();
    tick();
  };
  $('#t-min').onchange = (e) => {
    const v = Math.max(1, Math.min(240, Number(e.target.value) || exam.minutes));
    run.minutes = v;
    e.target.value = v;
    putRun();
    tick();
    drawItems();
  };
  const half = $('#t-half');
  if (half) half.onclick = () => {
    run.minutes = 30;
    $('#t-min').value = 30;
    putRun();
    tick();
    drawItems();
  };
  $$('[data-reveal]', view).forEach((b) => (b.onclick = () => {
    const id = b.dataset.reveal;
    run.revealed[id] = !run.revealed[id];
    putRun();
    drawItems();
  }));
  $$('[data-score]', view).forEach((input) => (input.oninput = () => {
    const it = items.find((i) => i.id === input.dataset.score);
    if (input.value === '') delete run.scores[it.id];
    else run.scores[it.id] = Math.max(0, Math.min(it.points, Number(input.value)));
    putRun();
    drawItems();
  }));
  // Show the clamped value once the user leaves the box.
  $$('[data-score]', view).forEach((input) => (input.onchange = () => (input.value = run.scores[input.dataset.score] ?? '')));

  function finish() {
    const unscored = items.filter((it) => run.scores[it.id] == null).length;
    if (unscored && !confirm(`${unscored} item${unscored > 1 ? 's are' : ' is'} unscored and will count as 0. Save anyway?`)) return;
    const score = items.reduce((s, it) => s + (Number(run.scores[it.id]) || 0), 0);
    const attempts = load('attempts', []);
    attempts.push({
      id: Math.random().toString(36).slice(2, 10),
      examId: exam.id,
      finishedAt: Date.now(),
      score,
      total: exam.points,
      minutes: run.minutes,
      elapsedMs: elapsed(run),
      scores: run.scores,
    });
    save('attempts', attempts);
    remove(`run.${exam.id}`);
    location.hash = '#exams';
  }
  $('#finish').onclick = finish;
  $('#finish2').onclick = finish;
  $('#discard').onclick = () => {
    if (!confirm('Discard the timer, revealed keys and scores for this attempt?')) return;
    remove(`run.${exam.id}`);
    route();
  };

  drawItems();
  tick();
  const timer = setInterval(tick, 250);
  cleanup = () => clearInterval(timer);

  if (focusId) {
    const el = document.getElementById(`item-${focusId}`);
    if (el) setTimeout(() => {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('flash-target');
    }, 0);
  }
}

// ================= Topic map =================
function renderTopics() {
  const problemTitle = Object.fromEntries(DATA.problems.map((p) => [p.id, p.title]));
  view.innerHTML = `
    <div class="stack">
      <h1>Topic map</h1>
      <p class="muted">Guide chapter → flashcards → past-exam items → optional OCaml practice problems.</p>
      <table class="topics">
        <thead><tr><th>Topic</th><th>Guide</th><th>Flashcards</th><th>Past-exam items</th><th>Practice problems</th></tr></thead>
        <tbody>${DATA.topics.map((t) => {
          const n = cardsIn(t.id).length;
          return `<tr>
            <td>${esc(t.title)}</td>
            <td>${esc(t.guide)}</td>
            <td><a class="chip" href="#cards/${encodeURIComponent(t.id)}">${n} card${n === 1 ? '' : 's'}</a></td>
            <td>${t.examRefs.length ? t.examRefs.map((r) => r.items.map((i) => `<a class="chip" href="#exams/${r.exam}/${encodeURIComponent(i)}">${esc(r.exam)} ${esc(i)}</a>`).join('')).join('') : '<span class="muted small">none in past exams</span>'}</td>
            <td>${t.problems.length ? t.problems.map((p) => `<a class="chip" href="#problems/${p}" title="${esc(problemTitle[p])}">Q${p}</a>`).join('') : '<span class="muted small">—</span>'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      <p class="muted small">No repo problems cover GUI, Java or ASM diagrams: use the past-exam items and flashcards for those.</p>
    </div>`;
}

// ================= Problem bank =================
function renderProblems([focus]) {
  const solved = load('solved', {});
  const groups = [];
  const placed = new Set();
  DATA.topics.filter((t) => t.problems.length).forEach((t) => {
    groups.push({ title: t.title, sub: t.guide, ids: t.problems });
    t.problems.forEach((p) => placed.add(p));
  });
  const other = DATA.problems.filter((p) => !placed.has(p.id) && !p.midterm1).map((p) => p.id);
  if (other.length) groups.push({ title: 'Other list practice', sub: 'Homework 1 style', ids: other });
  groups.push({ title: 'Midterm 1 / optional', sub: 'Trees, DNA/helices, sets, higher-order functions: not on Midterm 2', ids: DATA.problems.filter((p) => p.midterm1).map((p) => p.id) });
  const byId = Object.fromEntries(DATA.problems.map((p) => [p.id, p]));
  const done = Object.keys(solved).length;

  view.innerHTML = `
    <div class="stack">
      <h1>Problem bank</h1>
      <p class="muted">46 OCaml practice problems. Edit the starter file in the problem's folder, then run its tests locally (needs OCaml). The runner uses a small stack, so answers that aren't tail recursive fail the large-input test. ${done} marked solved.</p>
      ${groups.map((g) => `
        <div class="section-head"><h2>${esc(g.title)}</h2><span class="muted small">${esc(g.sub)}</span></div>
        ${g.ids.map((id) => byId[id]).filter(Boolean).map((p) => `
          <details class="card prob ${solved[p.id] ? 'solved' : ''}" id="prob-${p.id}" ${String(p.id) === focus ? 'open' : ''}>
            <summary><strong>Q${p.id}. ${esc(p.title)}</strong><span class="pill">${esc(p.filename || '')}</span>
              ${p.midterm1 ? '<span class="pill">optional</span>' : ''}${solved[p.id] ? '<span class="pill good">solved</span>' : ''}</summary>
            <div class="body">
              <div class="cmd"><pre>./problems/${esc(p.folder)}/run.sh</pre><button class="btn small" data-copy="./problems/${esc(p.folder)}/run.sh">Copy</button></div>
              <span class="muted small">Edit <code>problems/${esc(p.folder)}/${esc(p.filename)}</code>, then run the command from the project folder.</span>
              <pre class="wrap">${esc(p.text)}</pre>
              <label class="row small"><input type="checkbox" data-solved="${p.id}" ${solved[p.id] ? 'checked' : ''}> All tests pass (mark solved)</label>
            </div>
          </details>`).join('')}`).join('')}
    </div>`;

  $$('[data-copy]', view).forEach((b) => (b.onclick = async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = 'Copied';
    } catch {
      b.textContent = 'Select and copy';
    }
    setTimeout(() => (b.textContent = 'Copy'), 1500);
  }));
  $$('[data-solved]', view).forEach((box) => (box.onchange = () => {
    const st = load('solved', {});
    if (box.checked) st[box.dataset.solved] = true;
    else delete st[box.dataset.solved];
    save('solved', st);
    box.closest('.prob').classList.toggle('solved', box.checked);
  }));
  if (focus) {
    const el = document.getElementById(`prob-${focus}`);
    if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0);
  }
}

// ---------- export / import ----------
$('#export').onclick = () => {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) out[k] = localStorage.getItem(k);
    }
  } catch {}
  const blob = new Blob([JSON.stringify({ app: 'm2arena', version: 1, exportedAt: new Date().toISOString(), data: out }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `m2arena-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('#import').onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.app !== 'm2arena' || typeof parsed.data !== 'object') throw new Error('not an M2 Arena export');
    if (!confirm('Replace your current progress with this file?')) return;
    for (const [k, v] of Object.entries(parsed.data)) {
      if (k.startsWith(PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
    }
    route();
  } catch (err) {
    alert(`Couldn't import: ${err.message}`);
  }
};

// ---------- boot ----------
if (!DATA) {
  view.innerHTML = '<div class="card"><h2>js/data.js is missing</h2><p>Run <code>python3 scripts/build_data.py</code> in the project folder, then reload.</p></div>';
} else {
  window.addEventListener('hashchange', route);
  renderMiniCountdown();
  setInterval(renderMiniCountdown, 30000);
  route();
}
