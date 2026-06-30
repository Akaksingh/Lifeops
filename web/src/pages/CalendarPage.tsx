import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, RefreshCw } from 'lucide-react';
import { useLiveRecords, useUpdateRecord } from 'lemma-sdk/react';
import { lemmaClient, TASKS_TABLE, recordToTask, isOpenRow } from '../lib/lemma';
import { Task, SOURCE_GLYPH, typeBadge, todayStr, dueStatus, DUE_DOT } from '../lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { records, isLoading, refresh } = useLiveRecords({
    client: lemmaClient,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });
  const { update } = useUpdateRecord({ client: lemmaClient, tableName: TASKS_TABLE });

  const tasks: Task[] = useMemo(() => records.filter(isOpenRow).map(recordToTask), [records]);

  const today = todayStr();
  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(today);

  const gridStart = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    return new Date(view.year, view.month, 1 - first.getDay());
  }, [view]);

  // Google Calendar events came from the Next.js server (/api/calendar/events).
  // The hosted client app has no server, so the calendar shows dated tasks only.
  const tasksByDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      m.set(t.due_date, [...(m.get(t.due_date) ?? []), t]);
    }
    return m;
  }, [tasks]);

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const cells = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso = toISO(d);
      return {
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === view.month,
        isToday: iso === today,
        tasks: tasksByDate.get(iso) ?? [],
      };
    });
  }, [gridStart, view.month, today, tasksByDate]);

  const selDayTasks = selected ? tasksByDate.get(selected) ?? [] : [];

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function goToday() {
    const d = new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today);
  }
  async function markDone(id: string) {
    await update({ done: true }, { recordId: id });
    refresh();
  }

  return (
    <div className="flex gap-6 px-6 py-6 max-w-[1180px] mx-auto">
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Calendar</h1>
            <p className="text-sm text-neutral-500">Your dated tasks, laid out across the month.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="text-sm font-medium px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100">
              Today
            </button>
            <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-neutral-100" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4 text-neutral-600" />
            </button>
            <span className="text-sm font-semibold text-neutral-800 min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-neutral-100" aria-label="Next month">
              <ChevronRight className="w-4 h-4 text-neutral-600" />
            </button>
            <button onClick={() => refresh()} className="p-1.5 rounded-lg hover:bg-neutral-100" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 text-neutral-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Legend / connection status */}
        <div className="flex items-center gap-4 mb-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Task due
          </span>
          <span className="ml-auto text-amber-600">
            Google Calendar sync runs in the Next.js server build — not in this hosted app
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-100">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-[11px] font-medium text-neutral-400 text-center">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c, i) => {
              const isSel = c.iso === selected;
              const extra = c.tasks.length - Math.min(3, c.tasks.length);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(c.iso)}
                  className={`h-24 border-b border-r border-neutral-100 p-1.5 text-left align-top transition ${
                    c.inMonth ? 'bg-white' : 'bg-neutral-50/60'
                  } ${isSel ? 'ring-2 ring-inset ring-purple-400' : 'hover:bg-neutral-50'}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      c.isToday ? 'bg-purple-500 text-white font-semibold' : c.inMonth ? 'text-neutral-700' : 'text-neutral-300'
                    }`}
                  >
                    {c.day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {c.tasks.slice(0, 3).map((t) => {
                      const status = dueStatus(t.due_date) ?? 'future';
                      return (
                        <div key={t.id} className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DUE_DOT[status]}`} />
                          <span className="text-[10px] text-neutral-500 truncate">{t.title}</span>
                        </div>
                      );
                    })}
                    {extra > 0 && <span className="text-[10px] text-neutral-400">+{extra} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected day */}
      <aside className="w-80 shrink-0">
        <div className="rounded-2xl bg-white border border-neutral-200 p-4 sticky top-6">
          <h2 className="text-sm font-semibold text-neutral-800 mb-1">
            {selected
              ? new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Pick a day'}
          </h2>
          <p className="text-xs text-neutral-400 mb-3">
            {selDayTasks.length} task{selDayTasks.length === 1 ? '' : 's'}
          </p>

          <div className="space-y-2">
            {selDayTasks.length === 0 && (
              <p className="text-sm text-neutral-400 py-6 text-center">Nothing scheduled.</p>
            )}

            {selDayTasks.map((t) => {
              const badge = typeBadge(t);
              const g = SOURCE_GLYPH[t.source];
              return (
                <div key={t.id} className="flex items-start gap-2 rounded-xl border border-neutral-100 p-2.5">
                  <button
                    onClick={() => markDone(t.id)}
                    className="shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 border-neutral-300 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-center text-transparent hover:text-purple-600 transition"
                    aria-label="Mark done"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-900 leading-snug">{t.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${g.cls}`}>{g.glyph}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
