// Direct Google extraction (no MCP): pulls real candidate tasks from the user's
// Gmail, Drive, and Calendar using the refresh-token helper. Each source is
// independent — a failure in one returns [] for that source, never throws.

import { getGoogleAccessToken } from './google';
import type { ExtractedTask } from './agent';

export async function extractFromGoogle(): Promise<ExtractedTask[]> {
  const token = await getGoogleAccessToken();
  if (!token) return [];
  const [cal, gmail, drive] = await Promise.all([
    fetchCalendar(token).catch(() => []),
    fetchGmail(token).catch(() => []),
    fetchDrive(token).catch(() => []),
  ]);
  return [...cal, ...gmail, ...drive];
}

// ── Calendar → prep tasks for upcoming events (next 14 days) ──
async function fetchCalendar(token: string): Promise<ExtractedTask[]> {
  const now = new Date();
  const max = new Date(now);
  max.setDate(now.getDate() + 14);
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '20');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', max.toISOString());
  const res = await fetch(url.toString(), { headers: auth(token) });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items?: { id: string; summary?: string; htmlLink?: string; start?: { date?: string; dateTime?: string } }[];
  };
  return (data.items ?? [])
    .map((e) => {
      const dt = e.start?.dateTime ?? null;
      const date = dt ? localDate(dt) : e.start?.date ?? undefined;
      return {
        id: `gcal-${e.id}`,
        title: `Prepare for: ${e.summary || 'event'}`,
        source: 'calendar' as const,
        source_url: e.htmlLink,
        due_date: date,
        type: 'task' as const,
        followup: false,
        recurring: false,
      };
    })
    .filter((t) => !!t.due_date);
}

// ── Gmail → follow-up tasks from unread messages ──
async function fetchGmail(token: string): Promise<ExtractedTask[]> {
  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10',
    { headers: auth(token) }
  );
  if (!listRes.ok) return [];
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);
  const msgs = await Promise.all(
    ids.map(async (id): Promise<ExtractedTask | null> => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: auth(token) }
      );
      if (!r.ok) return null;
      const m = (await r.json()) as { id: string; payload?: { headers?: { name: string; value: string }[] } };
      const subject = header(m.payload?.headers, 'Subject') || '(no subject)';
      return {
        id: `gmail-${m.id}`,
        title: `Reply: ${subject}`,
        source: 'gmail' as const,
        source_url: `https://mail.google.com/mail/u/0/#inbox/${m.id}`,
        type: 'follow_up' as const,
        followup: true,
        recurring: false,
      };
    })
  );
  return msgs.filter((m): m is ExtractedTask => m !== null);
}

// ── Drive → review tasks from recently modified files ──
async function fetchDrive(token: string): Promise<ExtractedTask[]> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `modifiedTime > '${since.toISOString()}' and trashed = false`);
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '15');
  url.searchParams.set('fields', 'files(id,name,webViewLink)');
  const res = await fetch(url.toString(), { headers: auth(token) });
  if (!res.ok) return [];
  const data = (await res.json()) as { files?: { id: string; name?: string; webViewLink?: string }[] };
  return (data.files ?? []).map((f) => ({
    id: `drive-${f.id}`,
    title: `Review: ${f.name || 'file'}`,
    source: 'drive' as const,
    source_url: f.webViewLink,
    type: 'task' as const,
    followup: false,
    recurring: false,
  }));
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
function header(headers: { name: string; value: string }[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}
function localDate(dt: string): string {
  const d = new Date(dt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
