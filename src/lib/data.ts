import raw from '@/data/generated.json';
import type { Libs, Practice } from '@/lib/assemble';
import type { AsmData } from '@/lib/asm';

export type KeyStatus = 'official' | 'mock' | 'from-guide' | 'derived' | 'none';

export type Item = {
  id: string;
  points: number;
  shape?: string;
  prompt: string;
  code?: string;
  key: string;
  keyStatus: KeyStatus;
  notes?: string;
  practice?: Practice;
};
export type Section = { id: string; title: string; points: number; items: Item[] };
export type Exam = {
  id: string;
  kind: 'past' | 'mock';
  title: string;
  date?: string;
  instructors?: string;
  blurb?: string;
  points: number;
  minutes: number;
  notes?: string;
  sections: Section[];
  pdfs: { blank?: string; solutions?: string };
};
export type Card = { id: string; topic: string; front: string; back: string };
export type ExamRef = { exam: string; label: string; items: string[] };
export type Topic = {
  id: string;
  title: string;
  guide: string;
  cardTopics: string[];
  problems: number[];
  examRefs: ExamRef[];
};
export type Problem = {
  id: number;
  title: string;
  folder: string;
  filename: string;
  topics: string[];
  midterm1: boolean;
  text: string;
  starter: string;
  prelude: string;
  extraTests: string;
  extraInsideModule: boolean;
};
export type Task = { id: string; text: string; hours: number };
export type Day = { date: string; label: string; tasks: Task[] };
export type ExamSlot = { section: string; label: string; start: string };
export type Plan = { days: Day[]; minimum: string[]; examDay: string[]; exams: ExamSlot[] };

export type Drill = {
  id: string;
  title: string;
  group: string;
  level: 1 | 2 | 3;
  summary: string;
  signature: string;
  examples: string[];
  rules: string[];
  hint?: string;
  practice: Practice;
};

type Data = { cards: Card[]; topics: Topic[]; plan: Plan; exams: Exam[]; problems: Problem[]; practiceLibs: Libs; drills: Drill[]; asm: AsmData };
export const DATA = raw as unknown as Data;

export const topicById: Record<string, Topic> = Object.fromEntries(DATA.topics.map((t) => [t.id, t]));
export const examById: Record<string, Exam> = Object.fromEntries(DATA.exams.map((e) => [e.id, e]));
export const examItems = (e: Exam) => e.sections.flatMap((s) => s.items);

export const CARD_TOPIC_NAMES: Record<string, string> = {
  shapes: 'Question shapes', options: 'Options', unit: 'Unit and sequencing', records: 'Records',
  mutability: 'Mutability and aliasing', asm: 'OCaml ASM, == vs =', queues: 'Queues', tailrec: 'Tail recursion',
  deques: 'Deques', testing: 'Property-based tests', closures: 'Closures', gui: 'GUI library',
  java: 'Java basics', arrays: 'Java arrays', encapsulation: 'Encapsulation', traps: 'Exam traps',
};
export const cardTopicName = (t: string) => CARD_TOPIC_NAMES[t] ?? topicById[t]?.title ?? t;
export const CARD_TOPICS = [...new Set(DATA.cards.map((c) => c.topic))];

/** Cards in a card topic, or in every card topic a topic-map entry links. Empty = all. */
export function cardsIn(topic: string): Card[] {
  if (!topic) return DATA.cards;
  const linked = topicById[topic]?.cardTopics ?? [];
  return DATA.cards.filter((c) => c.topic === topic || linked.includes(c.topic));
}

export const KEY_STATUS: Record<KeyStatus, { label: string; tone: 'good' | 'warn' | 'bad' | 'plain' }> = {
  official: { label: 'Matches the official solutions', tone: 'good' },
  mock: { label: 'Written for this mock', tone: 'plain' },
  'from-guide': { label: 'From your study guide', tone: 'plain' },
  derived: { label: 'Worked out by hand, not in the official solutions', tone: 'warn' },
  none: { label: 'No key recorded', tone: 'bad' },
};

/** Which topic-map entries each exam item belongs to: "examId/itemId" -> topic ids. */
export const itemTopics: Record<string, string[]> = {};
for (const t of DATA.topics) {
  for (const r of t.examRefs) {
    for (const i of r.items) (itemTopics[`${r.exam}/${i}`] ??= []).push(t.id);
  }
}
