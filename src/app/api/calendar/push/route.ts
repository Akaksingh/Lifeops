import { NextRequest, NextResponse } from 'next/server';
import { pushTaskToCalendar } from '@/lib/agent';

export const dynamic = 'force-dynamic';

type Item = { id: string; title: string; due_date: string };

export async function POST(req: NextRequest) {
  const { tasks = [] } = (await req.json().catch(() => ({}))) as { tasks?: Item[] };

  let created = 0;
  const errors: string[] = [];
  for (const t of tasks) {
    if (!t.due_date) continue;
    try {
      await pushTaskToCalendar(t);
      created++;
    } catch (err) {
      errors.push(`${t.title}: ${err}`);
    }
  }

  return NextResponse.json({ ok: true, created, errors });
}
