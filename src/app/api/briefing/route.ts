import { NextRequest, NextResponse } from 'next/server';
import { generateDailyBriefing } from '@/lib/agent';

export const dynamic = 'force-dynamic';

// Counts come from the Lemma-backed client (source of truth lives in the pod).
export async function POST(req: NextRequest) {
  const { overdue = 0, today = 0, followups = 0, overdueTitles = [] } = await req
    .json()
    .catch(() => ({}));

  const briefing = await generateDailyBriefing(overdue, today, followups, overdueTitles);
  return NextResponse.json({ briefing });
}
