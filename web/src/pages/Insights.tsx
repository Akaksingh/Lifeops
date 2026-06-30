import { useMemo } from 'react';
import { AlertCircle, CalendarClock, Reply, Layers, Repeat, CheckCircle2 } from 'lucide-react';
import { useLiveRecords } from 'lemma-sdk/react';
import { lemmaClient, TASKS_TABLE, recordToTask } from '../lib/lemma';
import { Task, SOURCE_GLYPH, todayStr } from '../lib/types';

type SourceKey = 'gmail' | 'calendar' | 'notion' | 'drive' | 'manual';

export default function InsightsPage() {
  const { records } = useLiveRecords({
    client: lemmaClient,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });

  // All rows (including done) so completion stats are meaningful.
  const all: Task[] = useMemo(() => records.map(recordToTask), [records]);
  const open = useMemo(() => all.filter((t) => !t.done), [all]);
  const today = todayStr();

  const stats = useMemo(() => {
    const done = all.filter((t) => t.done).length;
    return {
      open: open.length,
      done,
      overdue: open.filter((t) => t.due_date && t.due_date < today).length,
      dueToday: open.filter((t) => t.due_date === today).length,
      followups: open.filter((t) => t.followup).length,
      recurring: open.filter((t) => t.recurring).length,
      completionRate: all.length ? Math.round((done / all.length) * 100) : 0,
    };
  }, [all, open, today]);

  const bySource = useMemo(() => {
    const keys: SourceKey[] = ['gmail', 'calendar', 'notion', 'drive', 'manual'];
    const max = Math.max(1, ...keys.map((k) => open.filter((t) => t.source === k).length));
    return keys.map((k) => ({
      key: k,
      count: open.filter((t) => t.source === k).length,
      pct: Math.round((open.filter((t) => t.source === k).length / max) * 100),
    }));
  }, [open]);

  const byType = useMemo(() => {
    const defs: { key: Task['type']; label: string; cls: string }[] = [
      { key: 'task', label: 'Tasks', cls: 'bg-purple-500' },
      { key: 'follow_up', label: 'Follow-ups', cls: 'bg-amber-500' },
      { key: 'deadline', label: 'Deadlines', cls: 'bg-green-500' },
      { key: 'recurring', label: 'Recurring', cls: 'bg-blue-500' },
    ];
    const max = Math.max(1, ...defs.map((d) => open.filter((t) => t.type === d.key).length));
    return defs.map((d) => ({
      ...d,
      count: open.filter((t) => t.type === d.key).length,
      pct: Math.round((open.filter((t) => t.type === d.key).length / max) * 100),
    }));
  }, [open]);

  return (
    <div className="px-6 py-6 max-w-[1180px] mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Insights</h1>
        <p className="text-sm text-neutral-500">A read on your open loops across every source.</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat icon={<Layers className="w-4 h-4" />} value={stats.open} label="Open loops" tone="green" />
        <Stat icon={<AlertCircle className="w-4 h-4" />} value={stats.overdue} label="Overdue" tone="red" />
        <Stat icon={<CalendarClock className="w-4 h-4" />} value={stats.dueToday} label="Due today" tone="amber" />
        <Stat icon={<Reply className="w-4 h-4" />} value={stats.followups} label="Follow-ups" tone="blue" />
        <Stat icon={<Repeat className="w-4 h-4" />} value={stats.recurring} label="Recurring" tone="purple" />
        <Stat icon={<CheckCircle2 className="w-4 h-4" />} value={stats.done} label="Completed" tone="green" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By source */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-5">
          <p className="text-sm font-semibold text-neutral-800 mb-4">Open loops by source</p>
          <div className="space-y-3">
            {bySource.map((s) => {
              const g = SOURCE_GLYPH[s.key];
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold shrink-0 ${g.cls}`}>
                    {g.glyph}
                  </span>
                  <span className="text-sm text-neutral-600 w-16 capitalize shrink-0">{s.key}</span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-neutral-800 w-6 text-right shrink-0">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By type */}
        <div className="rounded-2xl bg-white border border-neutral-200 p-5">
          <p className="text-sm font-semibold text-neutral-800 mb-4">By type</p>
          <div className="space-y-3">
            {byType.map((t) => (
              <div key={t.key} className="flex items-center gap-3">
                <span className="text-sm text-neutral-600 w-20 shrink-0">{t.label}</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div className={`h-full rounded-full ${t.cls}`} style={{ width: `${t.pct}%` }} />
                </div>
                <span className="text-sm font-medium text-neutral-800 w-6 text-right shrink-0">{t.count}</span>
              </div>
            ))}
          </div>

          {/* Completion */}
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-600">Completion rate</span>
              <span className="text-sm font-semibold text-neutral-900">{stats.completionRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.completionRate}%` }} />
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              {stats.done} done · {stats.open} still open
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: 'red' | 'amber' | 'blue' | 'green' | 'purple';
}) {
  const tones: Record<string, { ic: string; bg: string }> = {
    red: { ic: 'text-red-600', bg: 'bg-red-50' },
    amber: { ic: 'text-amber-600', bg: 'bg-amber-50' },
    blue: { ic: 'text-blue-600', bg: 'bg-blue-50' },
    green: { ic: 'text-green-600', bg: 'bg-green-50' },
    purple: { ic: 'text-purple-600', bg: 'bg-purple-50' },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-3.5">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl ${t.bg} ${t.ic} flex items-center justify-center`}>{icon}</span>
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
      </div>
      <p className={`text-sm font-medium mt-2 ${t.ic}`}>{label}</p>
    </div>
  );
}
