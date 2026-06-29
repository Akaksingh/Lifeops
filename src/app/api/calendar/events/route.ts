import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, isGoogleConfigured } from '@/lib/google';

// Reads the user's real Google Calendar (primary) for a time window and returns
// a flat, display-ready event list. Uses the refresh-token helper so it always
// has a valid access token.
export const dynamic = 'force-dynamic';

interface GoogleEvent {
  id: string;
  summary?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
}

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ connected: false, events: [] });
  }
  const token = await getGoogleAccessToken();
  if (!token) {
    return NextResponse.json({ connected: false, events: [], error: 'token_refresh_failed' });
  }

  const sp = req.nextUrl.searchParams;
  const timeMin = sp.get('timeMin') ?? new Date().toISOString();
  const timeMax = sp.get('timeMax') ?? undefined;

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');
  url.searchParams.set('timeMin', timeMin);
  if (timeMax) url.searchParams.set('timeMax', timeMax);

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    return NextResponse.json({ connected: true, events: [], error: await res.text() });
  }
  const data = (await res.json()) as { items?: GoogleEvent[] };

  const events = (data.items ?? [])
    .map((e) => {
      const dt = e.start?.dateTime ?? null;
      const allDay = !dt;
      const date = dt ? localDate(dt) : e.start?.date ?? null;
      const time = allDay
        ? 'All day'
        : new Date(dt as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return { id: e.id, title: e.summary || '(no title)', date, time, allDay, htmlLink: e.htmlLink ?? null };
    })
    .filter((e) => !!e.date);

  return NextResponse.json({ connected: true, events });
}

// Local-date ISO (YYYY-MM-DD) so events land on the right calendar cell.
function localDate(dt: string): string {
  const d = new Date(dt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
