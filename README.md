# Midterm 2 Arena

A study dashboard for CIS 1200 Midterm 2 (Friday, November 6, 2026), built with Next.js. Apart from downloading the Java runtime on the first Java run, it makes no network calls once loaded. Progress is saved in your browser's localStorage.

- **Today:** a countdown to your exam section, the day-by-day study plan with checkboxes, your flashcard and exam progress, your weakest topics from saved exam scores, and the exam-day checklist.
- **Flashcards:** 102 cards with Leitner spaced repetition. Press <kbd>Space</kbd> to show the answer, <kbd>K</kbd> if you knew it, <kbd>J</kbd> if you missed it. You can filter by topic.
- **Exams:** three original mock exams and four past midterms, each run under a timer. Keys stay hidden until you reveal them; then you score each item and save the attempt. Past exams link to the original exam and solutions PDFs.
- **ASM practice:** 21 step-through lessons that draw the stack and heap after each line (with "predict first" checkpoints), 24 picture quizzes, and a rules sheet covering everything the exam asks about the abstract stack machine, including Java.
- **Topic map:** an interactive tree of every topic (arrow keys work, and there's a filter), broken down into flashcards, exam items (shaded by your best score), drills, ASM lessons and practice problems.
- **Problems:** 30 tail-recursion drills (lists, accumulators, queues, deques, trees, mutable state) and the 46 OCaml practice problems, each with instructions beside an editor whose tests run on the page.
- **Live coding on exam questions:** 118 exam items open in an editor. Coding questions are graded by hidden tests; "what happens?" questions let you predict, then run. GUI questions run against your HW5 `gctx.ml` and `widget.ml` with a live, clickable preview.

## Run it

You need Node 20 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

`npm run build` writes a static site to `out/`, and `npm start` serves it.

Both commands first run `scripts/build-data.mjs`. It turns `data/` and `problems/` into `src/data/generated.json` and copies the exam PDFs from `source/` into `public/pdfs/`. Both outputs are gitignored.

Progress saved by the old single-file version doesn't carry over automatically, because it was stored under a different address. Use **Export progress** in the old version and **Import** here; the file format is the same.

## How code runs

Everything runs in the browser, so it works on Vercel with no server.

- **OCaml** runs in the real OCaml toplevel compiled to JavaScript ([`@live-codes/ocaml`](https://www.npmjs.com/package/@live-codes/ocaml)), in a web worker. `npm run data` copies it (about 13 MB) to `public/ocaml/`. Each graded run gets a fresh worker and a 20-second limit.
- **Java** compiles and runs with [CheerpJ 5](https://cheerpj.com), a JVM in WebAssembly that includes `javac`. It loads from Leaning Technologies' CDN on the first Java run (a few seconds), so Java needs an internet connection. CheerpJ is free for personal use; see its [licensing page](https://cheerpj.com/docs/licensing).
- **GUI questions** run against `practice/lib/gctx.ml` and `widget.ml` (your HW5 files). `practice/lib/g.ml` stands in for the Graphics module and records every drawing call; `harness.ml` lets tests click and inspect widgets, and the page paints the recording on a canvas and sends your mouse and key events back.
- **Tail recursion** is checked two ways. The large-input tests run a million elements. But the browser runtime runs functions that call closures (`p x`, `f acc x`) in continuation-passing style, so non-tail recursion through them never overflows there. So `src/lib/tailcheck.ts` also reads your code and checks that every recursive call is in tail position, explaining any that aren't ("its result is passed to +"). Drills, exam items with tail-recursion tests, and problems whose rules require it all use both checks.

### Practice specs

`data/practice/{ocaml,java,gui}.json` map `"examId/itemId"` to how an exam item runs: `starter`, `solution`, hidden `setup` and `tests`, and for GUI items a `preview` widget. `src/lib/assemble.ts` turns a spec plus your code into one program, the same way in the browser and in the checker.

`data/drills.json` holds the tail-recursion drills in the same format, plus a `nonTail` answer: correct, but not tail recursive.

Check every spec and drill with native `ocamlc` and `javac`. Each answer key must pass its tests, and no starter may pass all of them. Each drill's `nonTail` must fail only the tail-recursion tests, and the static tail-call check must accept the key and reject `nonTail`:

```bash
npm run check:practice
```

## Change the content

Edit the files in `data/`, then run `npm run data` (or restart `npm run dev`).

| File | Contents |
|---|---|
| `data/cards.json` | Flashcards: `id`, `topic`, `front`, `back` |
| `data/exams/<id>.json` | One file per exam: `kind` (`past` or `mock`), sections, then items with `prompt`, `code`, `key` and `keyStatus` |
| `data/topics.json` | The topic map, plus exam refs like `"25fa 1.2-1.5"` or `"26sp 3"` (a whole section) |
| `data/plan.json` | The study plan, checklists and exam start times |
| `data/drills.json` | Tail-recursion drills: instructions, signature, examples, rules, and a practice spec |
| `data/asm.json` | ASM lessons (each step's stack and heap), quizzes and the rules sheet. The build checks every pointer resolves |

The data build checks that points add up, every exam ref matches real items, and every card topic is in the topic map. If anything is wrong, it prints what and writes nothing.

`keyStatus` tells you how much to trust a key:

- `official`: checked against the official solutions. Where the official solution has a typo, the key is corrected and the item's notes say so.
- `mock`: written for the mock exams. Every code answer was compiled and run (OCaml against stub GUI modules, Java against the prompt's examples).
- `derived`: worked out by hand. Only Spring 2025 1.4 is still like this, because the official PDF leaves it unmarked.
- `from-guide` and `none` are still supported for new content.

## Exam PDFs

On Vercel, PDFs only appear if they're in the deployment, and `source/` is gitignored, so by default the deployed site shows no PDF links. Put the PDFs in `source/` with names like `midterm2-25fa-blank.pdf` and `midterm2-25fa-solutions.pdf`. Each past exam then shows links to them. `source/` is gitignored, so the course's PDFs are never committed.

## Run the practice problems

You need OCaml (`brew install ocaml` on macOS). Edit the starter file in a problem's folder, then run its tests from the project folder:

```bash
./problems/q46_reverse/run.sh
```

Each `run.sh` compiles the folder with `ocamlc` and runs the tests with a small stack (`OCAMLRUNPARAM='l=2000'`). An answer that isn't tail recursive fails the large-input test, as it would with the real grader.

Problems on trees, DNA/helices, sets and higher-order functions are Midterm 1 material. The app lists them separately.

Based on [Shom770/pe8-arena](https://github.com/Shom770/pe8-arena), with the multiplayer race removed.
