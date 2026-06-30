// Client-side stand-ins for the Next.js server routes.
//
// The hosted Lemma app has no server, so the two stateless AI routes
// (/api/extract and /api/briefing) run client-side here. Both mirror the
// original mock/template fallbacks (USE_MOCK_SOURCES + no ANTHROPIC_API_KEY),
// which is exactly the behaviour the deployed demo needs. Task state still
// lives in the pod via the Lemma SDK — these only produce candidates/text.

export interface ExtractedTask {
  id: string;
  title: string;
  source: 'gmail' | 'notion' | 'drive' | 'calendar';
  source_url?: string;
  due_date?: string;
  type: 'task' | 'follow_up' | 'deadline' | 'recurring';
  followup: boolean;
  recurring: boolean;
}

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Deterministic mock extraction — stable ids so dedup/upsert behaves like the real thing. */
export function mockExtraction(): ExtractedTask[] {
  return [
    {
      id: 'gmail-reply-to-acme-contract',
      title: 'Reply to Acme about the signed contract',
      source: 'gmail',
      source_url: 'https://mail.google.com/mail/u/0/#inbox',
      due_date: dayOffset(-1),
      type: 'follow_up',
      followup: true,
      recurring: false,
    },
    {
      id: 'gmail-confirm-invoice-payment',
      title: 'Confirm invoice #2043 payment with finance',
      source: 'gmail',
      source_url: 'https://mail.google.com/mail/u/0/#inbox',
      due_date: dayOffset(0),
      type: 'task',
      followup: true,
      recurring: false,
    },
    {
      id: 'calendar-prep-board-deck',
      title: 'Prepare agenda + deck for the board meeting',
      source: 'calendar',
      source_url: 'https://calendar.google.com/',
      due_date: dayOffset(2),
      type: 'deadline',
      followup: false,
      recurring: false,
    },
    {
      id: 'calendar-book-cab-airport',
      title: 'Book cab for the 6am airport run',
      source: 'calendar',
      source_url: 'https://calendar.google.com/',
      due_date: dayOffset(5),
      type: 'task',
      followup: false,
      recurring: false,
    },
    {
      id: 'notion-finish-q3-okrs',
      title: 'Finish drafting the Q3 OKRs',
      source: 'notion',
      source_url: 'https://www.notion.so/',
      due_date: dayOffset(3),
      type: 'task',
      followup: false,
      recurring: false,
    },
    {
      id: 'notion-weekly-team-sync-notes',
      title: 'Write up weekly team sync notes',
      source: 'notion',
      source_url: 'https://www.notion.so/',
      due_date: dayOffset(1),
      type: 'recurring',
      followup: false,
      recurring: true,
    },
    {
      id: 'drive-review-design-doc-comments',
      title: 'Address review comments on the design doc',
      source: 'drive',
      source_url: 'https://drive.google.com/',
      due_date: dayOffset(0),
      type: 'follow_up',
      followup: true,
      recurring: false,
    },
    {
      id: 'drive-sign-off-budget-sheet',
      title: 'Sign off on the 2026 budget spreadsheet',
      source: 'drive',
      source_url: 'https://drive.google.com/',
      due_date: dayOffset(7),
      type: 'task',
      followup: false,
      recurring: false,
    },
  ];
}

/** Templated daily briefing (the no-API-key fallback from the server's agent.ts). */
export function templateBriefing(
  overdueCount: number,
  todayCount: number,
  followupCount: number,
  overdueTitles: string[]
): string {
  if (overdueCount === 0 && todayCount === 0 && followupCount === 0) {
    return "You're all caught up — no overdue items, nothing due today, and no follow-ups waiting. Enjoy the clear runway.";
  }
  const lead =
    overdueCount > 0
      ? `You have ${overdueCount} overdue ${overdueCount === 1 ? 'item' : 'items'}${
          overdueTitles.length ? ` — start with "${overdueTitles[0]}"` : ''
        }.`
      : `Nothing overdue — nice.`;
  const rest = `Today: ${todayCount} due and ${followupCount} follow-up${
    followupCount === 1 ? '' : 's'
  } to close out.`;
  return `${lead} ${rest}`;
}
