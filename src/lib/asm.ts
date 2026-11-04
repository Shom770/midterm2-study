// Types for data/asm.json: step-through ASM lessons, quizzes and the rules sheet.

export type Val = { lit: string; ref?: undefined } | { ref: string; lit?: undefined };
export type StackEntry = { name: string; value: Val; frame?: undefined } | { frame: string; name?: undefined; value?: undefined };
export type Field = { name: string; value: Val; mutable?: boolean };
export type Cell = {
  id: string;
  kind: 'record' | 'some' | 'cons' | 'closure' | 'ref' | 'object' | 'array' | 'string';
  label?: string;
  fields: Field[];
  at?: [number, number];
};
export type AsmState = { stack: StackEntry[]; heap: Cell[]; workspace?: string };
export type Ask = { prompt: string; choices: string[]; answer: number; explain: string };
export type Step = AsmState & { line?: number | [number, number]; note: string; ask?: Ask };
export type Lesson = { id: string; title: string; group: string; summary: string; lang: 'ocaml' | 'java'; code: string; steps: Step[] };
export type Quiz = {
  id: string;
  group: string;
  prompt: string;
  code?: string;
  /** A diagram to match against text choices ("which program builds this?"). */
  picture?: AsmState;
  choices: { label?: string; state?: AsmState }[];
  answer: number;
  explain: string;
};
export type AsmData = { rules: { title: string; points: string[] }[]; lessons: Lesson[]; quizzes: Quiz[] };
