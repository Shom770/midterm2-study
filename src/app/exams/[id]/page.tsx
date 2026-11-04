import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DATA, examById } from '@/lib/data';
import { ExamRunner } from './ExamRunner';

export const dynamicParams = false;

export function generateStaticParams() {
  return DATA.exams.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: examById[id]?.title ?? 'Exam' };
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!examById[id]) notFound();
  return <ExamRunner id={id} />;
}
