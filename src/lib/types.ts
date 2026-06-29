export interface Task {
  id: string;
  title: string;
  source: 'gmail' | 'notion' | 'drive' | 'calendar' | 'manual';
  source_url: string | null;
  due_date: string | null;
  type: 'task' | 'follow_up' | 'deadline' | 'recurring';
  done: number;
  recurring: number;
  followup: number;
  created_at: string;
  updated_at: string;
  sync_count: number;
}

export const SOURCE_STYLES: Record<Task['source'], { label: string; cls: string }> = {
  gmail: { label: 'Gmail', cls: 'bg-red-100 text-red-700' },
  calendar: { label: 'Calendar', cls: 'bg-blue-100 text-blue-700' },
  notion: { label: 'Notion', cls: 'bg-neutral-200 text-neutral-700' },
  drive: { label: 'Drive', cls: 'bg-green-100 text-green-700' },
  manual: { label: 'Manual', cls: 'bg-purple-100 text-purple-700' },
};

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns 'overdue' | 'today' | 'future' | null for colour coding. */
export function dueStatus(due: string | null): 'overdue' | 'today' | 'future' | null {
  if (!due) return null;
  const today = todayStr();
  if (due < today) return 'overdue';
  if (due === today) return 'today';
  return 'future';
}

export const DUE_STYLES: Record<'overdue' | 'today' | 'future', string> = {
  overdue: 'text-red-600',
  today: 'text-amber-600',
  future: 'text-neutral-400',
};

export function formatDue(due: string | null): string {
  if (!due) return 'No date';
  const status = dueStatus(due);
  const d = new Date(due + 'T00:00:00');
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (status === 'overdue') return `Overdue · ${label}`;
  if (status === 'today') return `Today · ${label}`;
  return label;
}

/** Short due label used in compact rows: Today / Tomorrow / Fri, 30 May. */
export function shortDue(due: string | null): string {
  if (!due) return '—';
  const status = dueStatus(due);
  if (status === 'today') return 'Today';
  const today = new Date(todayStr() + 'T00:00:00');
  const d = new Date(due + 'T00:00:00');
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const DUE_DOT: Record<'overdue' | 'today' | 'future', string> = {
  overdue: 'bg-red-500',
  today: 'bg-amber-500',
  future: 'bg-blue-500',
};

// Type pill — handles the "Calendar Prep" special case (calendar-sourced task).
export function typeBadge(task: Task): { label: string; cls: string } {
  if (task.source === 'calendar' && task.type === 'task')
    return { label: 'Calendar Prep', cls: 'bg-blue-100 text-blue-700' };
  switch (task.type) {
    case 'follow_up':
      return { label: 'Follow-up', cls: 'bg-amber-100 text-amber-700' };
    case 'deadline':
      return { label: 'Deadline', cls: 'bg-green-100 text-green-700' };
    case 'recurring':
      return { label: 'Recurring', cls: 'bg-purple-100 text-purple-700' };
    default:
      return { label: 'Task', cls: 'bg-purple-100 text-purple-700' };
  }
}

// Compact brand-ish glyph for each source (emoji/letter stand-ins for logos).
export const SOURCE_GLYPH: Record<Task['source'], { glyph: string; cls: string }> = {
  gmail: { glyph: 'M', cls: 'bg-red-50 text-red-600' },
  calendar: { glyph: '31', cls: 'bg-blue-50 text-blue-600' },
  notion: { glyph: 'N', cls: 'bg-neutral-100 text-neutral-800' },
  drive: { glyph: '▲', cls: 'bg-green-50 text-green-600' },
  manual: { glyph: '✎', cls: 'bg-purple-50 text-purple-600' },
};

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
