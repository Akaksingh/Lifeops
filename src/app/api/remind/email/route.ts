import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

type Item = { title: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE_ME')) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured. Add it to .env.local to send digests.' },
      { status: 400 }
    );
  }

  const { overdue = [], today = [], followups = [] } = (await req
    .json()
    .catch(() => ({}))) as { overdue?: Item[]; today?: Item[]; followups?: Item[] };

  const resend = new Resend(apiKey);

  const rows = (items: Item[], label: string) =>
    items.length
      ? `<h3 style="color:#1a1a1a;margin:16px 0 8px">${label}</h3>
      ${items
        .map(
          (t) =>
            `<div style="padding:8px 12px;margin:4px 0;background:#f5f5f3;border-radius:6px;font-size:14px">${t.title}</div>`
        )
        .join('')}`
      : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#1a1a1a;margin-bottom:4px">Life Ops — daily briefing</h2>
      <p style="color:#888;font-size:13px;margin-bottom:20px">${new Date().toLocaleDateString(
        'en-IN',
        { weekday: 'long', day: 'numeric', month: 'long' }
      )}</p>
      ${rows(overdue, '🔴 Overdue')}
      ${rows(today, '🟡 Due today')}
      ${rows(followups, '🔵 Follow-ups')}
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="font-size:13px;color:#3b82f6">Open Life Ops →</a>
    </div>`;

  try {
    await resend.emails.send({
      from: 'Life Ops <digest@yourdomain.com>',
      to: process.env.DIGEST_TO_EMAIL!,
      subject: `Life Ops: ${overdue.length} overdue, ${today.length} today`,
      html,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
