import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Model + client
// ─────────────────────────────────────────────────────────────────────────────
// Extraction quality benefits from a stronger model; swap to 'claude-opus-4-8'
// if you want maximum recall. Sonnet 4.6 is a good cost/quality default.
const MODEL = 'claude-sonnet-4-6';

function hasAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && !key.includes('REPLACE_ME');
}

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const USE_MOCK = (process.env.USE_MOCK_SOURCES ?? 'true') !== 'false';

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

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────
export async function runExtractionCycle(): Promise<ExtractedTask[]> {
  if (USE_MOCK || !hasAnthropicKey()) {
    return mockExtractionCycle();
  }
  return runRealExtractionCycle();
}

// ─────────────────────────────────────────────────────────────────────────────
// STUB: deterministic-ish mock tasks so the whole app is runnable with no keys.
// Returns a stable id per item so dedup/upsert behaves like the real thing.
// ─────────────────────────────────────────────────────────────────────────────
function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function mockExtractionCycle(): ExtractedTask[] {
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

// ─────────────────────────────────────────────────────────────────────────────
// REAL extraction via the Anthropic MCP connector (beta).
//
// NOTE — this is the corrected, going-live path. It is NOT called while
// USE_MOCK_SOURCES is true. Before enabling it you must:
//   1. Set USE_MOCK_SOURCES=false and a real ANTHROPIC_API_KEY.
//   2. Obtain a per-user OAuth bearer token for each hosted MCP server and pass
//      it as `authorization_token` (the Google Workspace MCP servers and the
//      Notion MCP server are all OAuth 2.0). Wiring that OAuth flow is the
//      follow-up task — see README "Going live".
//
// The MCP connector requires: the beta endpoint (client.beta.messages),
// the `mcp-client-2025-11-20` beta flag, and a matching `mcp_toolset` tool entry
// for EVERY server in `mcp_servers`.
// ─────────────────────────────────────────────────────────────────────────────
function mcpServerConfig() {
  // authorization_token would come from your stored OAuth tokens, per user.
  return [
    { type: 'url' as const, name: 'gmail', url: process.env.GMAIL_MCP_URL!, authorization_token: process.env.GMAIL_OAUTH_TOKEN },
    { type: 'url' as const, name: 'calendar', url: process.env.CALENDAR_MCP_URL!, authorization_token: process.env.CALENDAR_OAUTH_TOKEN },
    { type: 'url' as const, name: 'drive', url: process.env.DRIVE_MCP_URL!, authorization_token: process.env.DRIVE_OAUTH_TOKEN },
    { type: 'url' as const, name: 'notion', url: process.env.NOTION_MCP_URL!, authorization_token: process.env.NOTION_TOKEN },
  ];
}

async function runRealExtractionCycle(): Promise<ExtractedTask[]> {
  const today = new Date().toISOString().split('T')[0];
  const servers = mcpServerConfig();

  const response = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 4096,
    betas: ['mcp-client-2025-11-20'],
    // Every server must be referenced by exactly one mcp_toolset entry.
    mcp_servers: servers,
    tools: servers.map((s) => ({ type: 'mcp_toolset', mcp_server_name: s.name })),
    system: `You are a personal life assistant agent. Your job is to scan the user's
Gmail, Google Calendar, Google Drive, and Notion for any open loops, tasks,
follow-ups, deadlines, or recurring commitments. Today is ${today}.

For each item you find, return a JSON object with these fields:
- id: a unique string (use source_tasktype_hash format)
- title: concise task title (max 80 chars)
- source: one of "gmail" | "notion" | "drive" | "calendar"
- source_url: link to the original item if available
- due_date: ISO date string if you can infer one, otherwise null
- type: "task" | "follow_up" | "deadline" | "recurring"
- followup: true if this requires a reply or response from the user
- recurring: true if this appears to happen regularly (weekly, monthly, etc.)

Return ONLY a JSON array. No markdown, no explanation, no preamble.
If a source is unavailable, skip it silently.`,
    messages: [
      {
        role: 'user',
        content: `Scan all my connected sources right now.
From Gmail: find unread emails with action items, unanswered questions, or deadlines mentioned.
From Calendar: find events in the next 30 days that need preparation tasks.
From Notion: find all unchecked to-do items and open tasks across my pages.
From Drive: find files with recent comments, review requests, or "needs attention" signals.
Return everything as a JSON array of task objects.`,
      },
    ],
    // mcp_servers / mcp_toolset / betas may be ahead of the installed SDK's
    // static types; cast keeps this compiling across SDK versions.
  } as never);

  const text = (response.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');

  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean) as ExtractedTask[];
  } catch {
    console.error('Agent returned non-JSON:', text.slice(0, 200));
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI daily briefing — falls back to a template when no Anthropic key is set.
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDailyBriefing(
  overdueCount: number,
  todayCount: number,
  followupCount: number,
  overdueTitles: string[]
): Promise<string> {
  if (!hasAnthropicKey()) {
    return templateBriefing(overdueCount, todayCount, followupCount, overdueTitles);
  }

  try {
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `Write a friendly 2-sentence daily briefing for a personal task app.
Be specific and action-oriented. Under 60 words total. No preamble.
Data: ${overdueCount} overdue tasks (${overdueTitles.slice(0, 3).join(', ')}),
${todayCount} due today, ${followupCount} follow-ups pending.`,
        },
      ],
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  } catch (err) {
    console.error('Briefing generation failed, using template:', err);
    return templateBriefing(overdueCount, todayCount, followupCount, overdueTitles);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Google Calendar two-way sync (MCP connector).
// Both are no-ops in stub mode so the rest of the app stays runnable.
// ─────────────────────────────────────────────────────────────────────────────
export async function pushTaskToCalendar(task: {
  title: string;
  due_date: string;
  id: string;
}): Promise<void> {
  if (USE_MOCK || !hasAnthropicKey()) {
    console.log(`[stub] would push to Calendar: "${task.title}" on ${task.due_date}`);
    return;
  }
  await client().beta.messages.create({
    model: MODEL,
    max_tokens: 512,
    betas: ['mcp-client-2025-11-20'],
    mcp_servers: [
      {
        type: 'url',
        name: 'calendar',
        url: process.env.CALENDAR_MCP_URL!,
        authorization_token: process.env.CALENDAR_OAUTH_TOKEN,
      },
    ],
    tools: [{ type: 'mcp_toolset', mcp_server_name: 'calendar' }],
    messages: [
      {
        role: 'user',
        content: `Create a Google Calendar event with these details:
Title: ${task.title}
Date: ${task.due_date}
Description: Life Ops task — ID: ${task.id}
Set a 30-minute reminder. Use the primary calendar.`,
      },
    ],
  } as never);
}

export async function pullCalendarIntoTasks(): Promise<ExtractedTask[]> {
  if (USE_MOCK || !hasAnthropicKey()) {
    return [];
  }
  const response = await client().beta.messages.create({
    model: MODEL,
    max_tokens: 2048,
    betas: ['mcp-client-2025-11-20'],
    mcp_servers: [
      {
        type: 'url',
        name: 'calendar',
        url: process.env.CALENDAR_MCP_URL!,
        authorization_token: process.env.CALENDAR_OAUTH_TOKEN,
      },
    ],
    tools: [{ type: 'mcp_toolset', mcp_server_name: 'calendar' }],
    system: `You are a task extraction agent. Look at the user's upcoming Google Calendar
events for the next 14 days. For each event, generate a preparation task if one would be
helpful (e.g. "Prepare agenda for [meeting]", "Book cab for [appointment]"). Return ONLY
a JSON array of task objects with: title, source ("calendar"), due_date (1 day before the
event), type ("task"), followup (false), recurring (false). If no prep is needed, skip the
event. Return [] if nothing useful found.`,
    messages: [
      { role: 'user', content: 'List upcoming calendar events and generate preparation tasks.' },
    ],
  } as never);

  const text = (response.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return [];
  }
}

function templateBriefing(
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
