import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { isPro } from '@/lib/billing';

export const dynamic = 'force-dynamic';

type Item = { title: string };

export async function POST(req: NextRequest) {
  if (!isPro()) {
    return NextResponse.json(
      { error: 'Pro plan required', upgrade_url: '/settings#billing' },
      { status: 403 }
    );
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.includes('REPLACE_ME')) {
    return NextResponse.json({ error: 'Twilio credentials not configured.' }, { status: 400 });
  }

  const { overdue = [], today = [] } = (await req.json().catch(() => ({}))) as {
    overdue?: Item[];
    today?: Item[];
  };

  const client = twilio(sid, token);
  const body = [
    `Life Ops update:`,
    overdue.length ? `Overdue: ${overdue.slice(0, 3).map((t) => t.title).join(', ')}` : '',
    today.length ? `Today: ${today.slice(0, 3).map((t) => t.title).join(', ')}` : '',
    `Open app: ${process.env.NEXT_PUBLIC_APP_URL}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: process.env.USER_PHONE_NUMBER!,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
