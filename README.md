# Midterm 2 Arena

An offline study app for CIS 1200 Midterm 2 (Friday, November 6, 2026). It's a plain static page with no network calls. Progress is saved in your browser's localStorage.

- **Today:** a countdown to your exam section, the day-by-day study plan with checkboxes, and the exam-day checklist.
- **Flashcards:** 102 cards with Leitner spaced repetition. Press <kbd>Space</kbd> to reveal, <kbd>K</kbd> if you knew it, <kbd>J</kbd> if you missed it. You can filter by topic.
- **Exams:** four past midterms under a timer. Keys stay hidden until you reveal them; then you score each item and save the attempt.
- **Topic map:** each guide chapter, linked to its flashcards, past-exam items and practice problems.
- **Problems:** the 46 OCaml practice problems, with run commands.

## Open the app

Open `index.html` in a browser. Double-clicking works, because the data loads from `js/data.js` and there's no fetch.

## Change the content

Edit the files in `data/`, then regenerate `js/data.js`:

```bash
python3 scripts/build_data.py
```

| File | Contents |
|---|---|
| `data/cards.json` | Flashcards: `id`, `topic`, `front`, `back` |
| `data/exams/<id>.json` | One file per exam: sections, then items with `prompt`, `code`, `key` and `keyStatus` |
| `data/topics.json` | The topic map, plus exam refs like `"25fa 1.2-1.5"` or `"26sp 3"` (a whole section) |
| `data/plan.json` | The study plan, checklists and exam start times |

The build checks that points add up, every exam ref matches real items, and every card topic is in the topic map. It refuses to write `js/data.js` if anything is wrong. Never edit `js/data.js` by hand.

`keyStatus` tells you how much to trust a key:

- `from-guide`: from your study guide.
- `derived`: worked out by hand; double-check it.
- `none`: no key recorded; grade against the official solutions.

Some items also have **notes**, shown after you reveal the key. These record where the exam PDF and the study notes disagreed. Treat any answers in the notes as unverified.

## Run the practice problems

You need OCaml (`brew install ocaml` on macOS). Edit the starter file in a problem's folder, then run its tests from the project folder:

```bash
./problems/q46_reverse/run.sh
```

Each `run.sh` compiles the folder with `ocamlc` and runs the tests with a small stack (`OCAMLRUNPARAM='l=2000'`). An answer that isn't tail recursive fails the large-input test, as it would with the real grader.

Problems on trees, DNA/helices, sets and higher-order functions are Midterm 1 material. The app marks them as optional.

## Not included yet

- **Study guide mock exam:** save the guide text as `source/study-guide.md` to build `data/exams/mock.json`.
- **GUI, Java and ASM-diagram problem packs:** the repo has none. Use the past-exam items and flashcards for these topics for now.

The exam PDFs live in `source/`, which is gitignored.

Based on [Shom770/pe8-arena](https://github.com/Shom770/pe8-arena), with the multiplayer race removed.
