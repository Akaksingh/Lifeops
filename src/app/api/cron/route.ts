import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In the Lemma architecture, recurring source sync + digests are best modelled as
// a Lemma Schedule (client.schedules / useCreateSchedule) that triggers an agent or
// workflow inside the pod — see README "Using Lemma". This endpoint stays as a
// guarded hook for external schedulers that want to warm extraction.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  await fetch(`${base}/api/extract`).catch(() => {});
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
}
