'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, RefreshCw, ExternalLink, CalendarDays } from 'lucide-react';
import { useLiveRecords, useUpdateRecord } from 'lemma-sdk/react';
import { useLemma, TASKS_TABLE, recordToTask, isOpenRow } from '@/lib/lemmaClient';
import { Task, SOURCE_GLYPH, typeBadge, todayStr, dueStatus, DUE_DOT } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface GEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "All day" | "3:00 PM"
  allDay: boolean;
  htmlLink: string | null;
}

export default function CalendarPage() {
  const client = useLemma();
  const { records, isLoading, refresh } = useLiveRecords({
    client,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });
  const { update } = useUpdateRecord({ client, tableName: TASKS_TABLE });

  const tasks: Task[] = useMemo(() => records.filter(isOpenRow).map(recordToTask), [records]);

  const today = todayStr();
  const [view, setView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(today);

  // ── Real Google Calendar events for the visible 6-week window ──
  const [events, setEvents] = useState<GEvent[]>([]);
  const [gcal, setGcal] = useState<boolean | null>(null);
  const [loadingGcal, setLoadingGcal] = useState(false);

  const gridStart = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    return new Date(view.year, view.month, 1 - first.getDay());
  }, [view]);

  useEffect(() => {
    const ctrl = new AbortController();
    const tMax = new Date(gridStart);
    tMax.setDate(gridStart.getDate() + 42);
    setLoadingGcal(true);
    fetch(`/api/calendar/events?timeMin=${gridStart.toISOString()}&timeMax=${tMax.toISOString()}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setGcal(!!d.connected);
      })
      .catch(() => {})
      .finally(() => setLoadingGcal(false));
    return () => ctrl.abort();
  }, [gridStart]);

  // ── Group tasks + events by date ──
  const tasksByDate = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      m.set(t.due_date, [...(m.get(t.due_date) ?? []), t]);
    }
    return m;
  }, [tasks]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, GEvent[]>();
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

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
        events: eventsByDate.get(iso) ?? [],
        tasks: tasksByDate.get(iso) ?? [],
      };
    });
  }, [gridStart, view.month, today, eventsByDate, tasksByDate]);

  const selDayEvents = selected ? eventsByDate.get(selected) ?? [] : [];
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
            <p className="text-sm text-neutral-500">Your Google Calendar events and dated tasks, together.</p>
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
              <RefreshCw className={`w-4 h-4 text-neutral-400 ${isLoading || loadingGcal ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Legend / connection status */}
        <div className="flex items-center gap-4 mb-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Google event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Task due
          </span>
          {gcal === true && (
            <span className="ml-auto flex items-center gap-1 text-green-600">
              <CalendarDays className="w-3.5 h-3.5" /> Google Calendar connected
            </span>
          )}
          {gcal === false && (
            <span className="ml-auto text-amber-600">Google Calendar not connected — set tokens in .env.local</span>
          )}
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
              const extra = c.events.length + c.tasks.length - Math.min(2, c.events.length) - taskShown(c.events.length, c.tasks.length);
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
                    {/* Google events first (indigo) */}
                    {c.events.slice(0, 2).map((e) => (
                      <div key={e.id} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-500" />
                        <span className="text-[10px] text-neutral-700 truncate">{e.title}</span>
                      </div>
                    ))}
                    {/* Then tasks */}
                    {c.tasks.slice(0, taskShown(c.events.length, c.tasks.length)).map((t) => {
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
            {selDayEvents.length} event{selDayEvents.length === 1 ? '' : 's'} · {selDayTasks.length} task
            {selDayTasks.length === 1 ? '' : 's'}
          </p>

          <div className="space-y-2">
            {selDayEvents.length === 0 && selDayTasks.length === 0 && (
              <p className="text-sm text-neutral-400 py-6 text-center">Nothing scheduled.</p>
            )}

            {/* Google events */}
            {selDayEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900 leading-snug">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-indigo-600">{e.time}</span>
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noreferrer" className="text-[11px] text-neutral-400 hover:text-indigo-600 inline-flex items-center gap-0.5">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Tasks */}
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

// How many task chips to show given events already took up to 2 of 3 slots.
function taskShown(eventCount: number, taskCount: number): number {
  const slots = 3 - Math.min(2, eventCount);
  return Math.min(slots, taskCount);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
