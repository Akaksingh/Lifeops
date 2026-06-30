import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Plus,
  Check,
  AlertCircle,
  CalendarClock,
  Reply,
  Layers,
  Sparkles,
  Star,
  Calendar as CalIcon,
  Flag,
  ChevronDown,
} from 'lucide-react';
import { useLiveRecords, useCreateRecord, useUpdateRecord, useAuth } from 'lemma-sdk/react';
import { lemmaClient, TASKS_TABLE, recordToTask, isOpenRow } from '../lib/lemma';
import {
  Task,
  SOURCE_GLYPH,
  typeBadge,
  shortDue,
  dueStatus,
  DUE_DOT,
  greeting,
  todayStr,
} from '../lib/types';
import { mockExtraction, templateBriefing } from '../lib/data';
import RightRail from '../components/RightRail';

const FILTERS = ['today', 'all', 'overdue', 'followups', 'recurring'] as const;
type Filter = (typeof FILTERS)[number];
const SOURCES = ['all', 'gmail', 'calendar', 'notion', 'drive'] as const;

export default function Dashboard() {
  const { user } = useAuth(lemmaClient);

  const { records, isLoading, refresh } = useLiveRecords({
    client: lemmaClient,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });
  const { create } = useCreateRecord({ client: lemmaClient, tableName: TASKS_TABLE });
  const { update } = useUpdateRecord({ client: lemmaClient, tableName: TASKS_TABLE });

  const tasks: Task[] = useMemo(() => records.filter(isOpenRow).map(recordToTask), [records]);
  const existingExtIds = useMemo(
    () => new Set(records.map((r) => String(r.ext_id ?? ''))),
    [records]
  );

  const [filter, setFilter] = useState<Filter>('today');
  const [source, setSource] = useState<(typeof SOURCES)[number]>('all');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [briefing, setBriefing] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [quick, setQuick] = useState('');

  const today = todayStr();
  const stats = useMemo(() => {
    return {
      overdue: tasks.filter((t) => t.due_date && t.due_date < today).length,
      dueToday: tasks.filter((t) => t.due_date === today).length,
      followups: tasks.filter((t) => t.followup).length,
      open: tasks.length,
    };
  }, [tasks, today]);

  // Briefing — counts come from the Lemma-backed list; text is templated client-side.
  const loadBriefing = useCallback(() => {
    const overdueTitles = tasks
      .filter((t) => t.due_date && t.due_date < today)
      .slice(0, 3)
      .map((t) => t.title);
    setBriefing(templateBriefing(stats.overdue, stats.dueToday, stats.followups, overdueTitles));
  }, [tasks, stats, today]);

  useEffect(() => {
    if (!isLoading) loadBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, stats.overdue, stats.dueToday, stats.followups]);

  const visible = useMemo(() => {
    let list = tasks;
    switch (filter) {
      case 'today':
        list = list.filter((t) => t.due_date && t.due_date <= today);
        break;
      case 'overdue':
        list = list.filter((t) => t.due_date && t.due_date < today);
        break;
      case 'followups':
        list = list.filter((t) => t.followup);
        break;
      case 'recurring':
        list = list.filter((t) => t.recurring);
        break;
    }
    if (source !== 'all') list = list.filter((t) => t.source === source);
    return list;
  }, [tasks, filter, source, today]);

  // ── Mutations (Lemma SDK) ───────────────────────────────────────────────────
  async function onAdd(title: string) {
    await create({
      title,
      source: 'manual',
      type: 'task',
      followup: false,
      recurring: false,
      done: false,
      sync_count: 1,
      ext_id: `manual-${crypto.randomUUID().slice(0, 8)}`,
    });
    refresh();
  }

  async function onQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quick.trim()) return;
    await onAdd(quick.trim());
    setQuick('');
  }

  async function markDone(id: string) {
    await update({ done: true }, { recordId: id });
    refresh();
  }

  // Sync: extract candidates (mock, client-side), write the new ones into Lemma.
  async function syncNow() {
    setSyncing(true);
    try {
      const extracted = mockExtraction();
      const fresh = extracted.filter((t) => !existingExtIds.has(t.id));
      for (const t of fresh) {
        await lemmaClient.records.create(TASKS_TABLE, {
          title: t.title,
          source: t.source,
          source_url: t.source_url ?? null,
          due_date: t.due_date ?? null,
          type: t.type,
          followup: !!t.followup,
          recurring: !!t.recurring,
          done: false,
          sync_count: 1,
          ext_id: t.id,
        });
      }
      refresh();
    } finally {
      setSyncing(false);
    }
  }

  const name = userName(user);
  const liveSources = useMemo(() => buildLiveSources(tasks), [tasks]);

  return (
    <div className="flex gap-6 px-6 py-6 max-w-[1180px] mx-auto">
      {/* ── Center column ── */}
      <div className="flex-1 min-w-0">
        <header className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {greeting()}, {name} <span className="align-middle">☀️</span>
            </h1>
            <p className="text-sm text-neutral-500">Here&apos;s your day at a glance.</p>
          </div>
          <button
            onClick={loadBriefing}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200"
          >
            <Sparkles className="w-4 h-4" /> AI Briefing
          </button>
        </header>

        {/* Briefing card */}
        <div className="relative mb-5 rounded-2xl bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 border border-purple-100 p-5 overflow-hidden">
          <span className="absolute left-4 top-2 text-3xl text-purple-300 leading-none">&ldquo;</span>
          <p className="text-[15px] text-neutral-800 leading-relaxed pl-6 pr-44">
            {isLoading ? 'Reading your day…' : briefing || 'No briefing yet — hit Sync to pull your sources.'}
          </p>
          <img
            src="/briefing-art.png"
            alt=""
            className="absolute right-3 bottom-2 h-24 w-auto object-contain pointer-events-none select-none"
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard icon={<AlertCircle className="w-4 h-4" />} value={stats.overdue} label="Overdue" tone="red" onView={() => setFilter('overdue')} />
          <StatCard icon={<CalendarClock className="w-4 h-4" />} value={stats.dueToday} label="Due Today" tone="amber" onView={() => setFilter('today')} />
          <StatCard icon={<Reply className="w-4 h-4" />} value={stats.followups} label="Follow-ups" tone="blue" onView={() => setFilter('followups')} />
          <StatCard icon={<Layers className="w-4 h-4" />} value={stats.open} label="Open Loops" tone="green" onView={() => setFilter('all')} />
        </div>

        {/* Tabs + source filter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 items-center">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg capitalize transition ${
                  filter === f ? 'bg-purple-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {f === 'today' && <Sparkles className="w-3.5 h-3.5" />}
                {f === 'followups' ? 'Follow-ups' : f}
                {f === 'overdue' && stats.overdue > 0 && (
                  <span className={`text-[10px] rounded-full px-1.5 ${filter === f ? 'bg-white/25' : 'bg-red-500 text-white'}`}>
                    {stats.overdue}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setSourceOpen((o) => !o)}
              className="flex items-center gap-1 text-sm text-neutral-600 px-2 py-1.5 rounded-lg hover:bg-neutral-100"
            >
              {source === 'all' ? 'All Sources' : source[0].toUpperCase() + source.slice(1)}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {sourceOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1">
                {SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSource(s);
                      setSourceOpen(false);
                    }}
                    className="w-full text-left text-sm px-3 py-1.5 hover:bg-neutral-50 capitalize"
                  >
                    {s === 'all' ? 'All Sources' : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task list */}
        <div className="rounded-2xl bg-white border border-neutral-200 divide-y divide-neutral-100">
          {!isLoading && visible.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-neutral-400">
              Nothing here. Click <button onClick={syncNow} className="text-purple-600 font-medium">Sync</button> to pull from your sources.
            </div>
          )}
          {visible.map((t) => (
            <TaskRow key={t.id} task={t} onDone={() => markDone(t.id)} />
          ))}

          {/* Quick add bar */}
          <form onSubmit={onQuickAdd} className="flex items-center gap-2 px-3 py-2.5">
            <button type="submit" className="p-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600" aria-label="Add">
              <Plus className="w-4 h-4" />
            </button>
            <input
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              placeholder="Quick add a task…"
              className="flex-1 text-sm bg-transparent focus:outline-none py-1"
            />
            <CalIcon className="w-4 h-4 text-neutral-300" />
            <Flag className="w-4 h-4 text-neutral-300" />
          </form>
        </div>

        {/* Live from your sources */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-neutral-700">Live from your sources</p>
            <button onClick={syncNow} disabled={syncing} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-50" aria-label="Sync">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {liveSources.map((s) => (
              <div key={s.source} className="rounded-xl bg-white border border-neutral-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-800">
                    <SourceGlyph source={s.source} /> {s.label}
                  </span>
                  {s.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {s.count} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 truncate">{s.sample || 'No items'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right rail ── */}
      <RightRail tasks={tasks} onAdd={onAdd} />
    </div>
  );
}

// ── helpers + small components ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function userName(user: any): string {
  return user?.name || user?.firstName || (user?.email ? user.email.split('@')[0] : 'there');
}

function buildLiveSources(tasks: Task[]) {
  const defs: { source: Task['source']; label: string }[] = [
    { source: 'gmail', label: 'Gmail' },
    { source: 'calendar', label: 'Calendar' },
    { source: 'notion', label: 'Notion' },
    { source: 'drive', label: 'Drive' },
  ];
  return defs.map((d) => {
    const items = tasks.filter((t) => t.source === d.source);
    return { ...d, count: items.length, sample: items[0]?.title ?? '' };
  });
}

function SourceGlyph({ source }: { source: Task['source'] }) {
  const g = SOURCE_GLYPH[source];
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${g.cls}`}>
      {g.glyph}
    </span>
  );
}

function StatCard({
  icon,
  value,
  label,
  tone,
  onView,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: 'red' | 'amber' | 'blue' | 'green';
  onView: () => void;
}) {
  const tones: Record<string, { ic: string; bg: string }> = {
    red: { ic: 'text-red-600', bg: 'bg-red-50' },
    amber: { ic: 'text-amber-600', bg: 'bg-amber-50' },
    blue: { ic: 'text-blue-600', bg: 'bg-blue-50' },
    green: { ic: 'text-green-600', bg: 'bg-green-50' },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl bg-white border border-neutral-200 p-3.5">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl ${t.bg} ${t.ic} flex items-center justify-center`}>{icon}</span>
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
      </div>
      <p className={`text-sm font-medium mt-2 ${t.ic}`}>{label}</p>
      <button onClick={onView} className="text-xs text-neutral-400 hover:text-neutral-600 mt-0.5">
        View all →
      </button>
    </div>
  );
}

function TaskRow({ task, onDone }: { task: Task; onDone: () => void }) {
  const status = dueStatus(task.due_date) ?? 'future';
  const badge = typeBadge(task);
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-neutral-50/60 transition">
      <button
        onClick={onDone}
        className="shrink-0 w-5 h-5 rounded-md border-2 border-neutral-300 hover:border-purple-500 hover:bg-purple-50 flex items-center justify-center text-transparent hover:text-purple-600 transition"
        aria-label="Mark done"
      >
        <Check className="w-3 h-3" />
      </button>

      <span className="text-sm text-neutral-900 truncate">{task.title}</span>
      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${badge.cls}`}>{badge.label}</span>

      <div className="ml-auto flex items-center gap-3 shrink-0">
        <SourceGlyph source={task.source} />
        <span className="flex items-center gap-1.5 min-w-[92px] justify-end">
          <span className={`text-xs ${status === 'overdue' ? 'text-red-600' : status === 'today' ? 'text-amber-600' : 'text-blue-600'}`}>
            {shortDue(task.due_date)}
          </span>
          <span className={`w-2 h-2 rounded-full ${DUE_DOT[status]}`} />
        </span>
        <button className="text-neutral-300 hover:text-amber-400" aria-label="Star">
          <Star className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
