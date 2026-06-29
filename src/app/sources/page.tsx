'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { useLiveRecords } from 'lemma-sdk/react';
import { useLemma, TASKS_TABLE, recordToTask, isOpenRow } from '@/lib/lemmaClient';
import { Task, SOURCE_GLYPH } from '@/lib/types';

type SourceKey = 'gmail' | 'calendar' | 'notion' | 'drive';

const SOURCE_DEFS: { key: SourceKey; label: string; blurb: string }[] = [
  { key: 'gmail', label: 'Gmail', blurb: 'Reads unread emails — extracts action items, reply-needed threads, and mentioned deadlines.' },
  { key: 'calendar', label: 'Google Calendar', blurb: 'Reads upcoming events and generates prep tasks the day before.' },
  { key: 'notion', label: 'Notion', blurb: 'Scans pages and databases for unchecked to-dos and open tasks.' },
  { key: 'drive', label: 'Google Drive', blurb: 'Detects files with recent comments, review requests, and unresolved feedback.' },
];

export default function SourcesPage() {
  const client = useLemma();
  const { records, refresh } = useLiveRecords({
    client,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });
  const tasks: Task[] = useMemo(() => records.filter(isOpenRow).map(recordToTask), [records]);

  const existingExtIds = useMemo(() => new Set(records.map((r) => String(r.ext_id ?? ''))), [records]);
  const [syncing, setSyncing] = useState(false);

  const perSource = useMemo(() => {
    const m = new Map<SourceKey, { count: number; sample: string }>();
    for (const def of SOURCE_DEFS) {
      const items = tasks.filter((t) => t.source === def.key);
      m.set(def.key, { count: items.length, sample: items[0]?.title ?? '' });
    }
    return m;
  }, [tasks]);

  // Same sync path the dashboard uses: extract on the server, write new rows to Lemma.
  async function syncNow() {
    setSyncing(true);
    try {
      const { tasks: extracted } = await fetch('/api/extract').then((r) => r.json());
      const fresh = (extracted ?? []).filter((t: { id: string }) => !existingExtIds.has(t.id));
      for (const t of fresh) {
        await client.records.create(TASKS_TABLE, {
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

  return (
    <div className="px-6 py-6 max-w-[1180px] mx-auto">
      <header className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sources</h1>
          <p className="text-sm text-neutral-500">Connected services the agent scans for open loops.</p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync now
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {SOURCE_DEFS.map((def) => {
          const stat = perSource.get(def.key)!;
          const g = SOURCE_GLYPH[def.key];
          return (
            <div key={def.key} className="rounded-2xl bg-white border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${g.cls}`}>
                    {g.glyph}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-neutral-900">{def.label}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected (mock)
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-bold text-neutral-900">{stat.count}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{def.blurb}</p>
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-0.5">Latest item</p>
                <p className="text-sm text-neutral-700 truncate">{stat.sample || '—'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Circle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Running in mock mode</p>
          <p className="text-amber-700/90 mt-0.5">
            Sources return realistic sample data so the loop is demoable. To pull real items, set{' '}
            <code className="text-xs">USE_MOCK_SOURCES=false</code>, add a real{' '}
            <code className="text-xs">ANTHROPIC_API_KEY</code>, and connect each service&apos;s OAuth + MCP endpoint
            in <code className="text-xs">.env.local</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
