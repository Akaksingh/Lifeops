'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useLiveRecords, useUpdateRecord } from 'lemma-sdk/react';
import { useLemma, TASKS_TABLE, recordToTask, isOpenRow } from '@/lib/lemmaClient';
import { Task, todayStr } from '@/lib/types';

export default function FloaterNotification() {
  const client = useLemma();
  const { records } = useLiveRecords({ client, tableName: TASKS_TABLE, limit: 500, reconcile: 'merge' });
  const { update } = useUpdateRecord({ client, tableName: TASKS_TABLE });

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dueToday: Task[] = useMemo(() => {
    const today = todayStr();
    return records
      .filter(isOpenRow)
      .map(recordToTask)
      .filter((t) => t.due_date && t.due_date <= today);
  }, [records]);

  // Ask for notification permission once.
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Fire a native notification 30 min before end-of-day for due-today tasks.
  useEffect(() => {
    function check() {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = Date.now();
      dueToday.forEach((t) => {
        if (!t.due_date) return;
        const due = new Date(t.due_date + 'T23:59:00').getTime();
        const mins = (due - now) / 60000;
        if (mins > 0 && mins <= 30) {
          new Notification('Life Ops reminder', { body: t.title, icon: '/favicon.ico' });
        }
      });
    }
    check();
    const id = setInterval(check, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [dueToday]);

  const toast = dueToday.find((t) => !dismissed.has(t.id)) ?? null;
  if (!toast) return null;

  function dismiss() {
    if (toast) setDismissed((s) => new Set(s).add(toast.id));
  }
  async function markDone() {
    if (!toast) return;
    await update({ done: true }, { recordId: toast.id });
    setDismissed((s) => new Set(s).add(toast.id));
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-500">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Due today</p>
          <p className="text-sm font-medium text-neutral-900 leading-snug">{toast.title}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={markDone} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-700">
              <Check className="w-3.5 h-3.5" /> Mark done
            </button>
            <button onClick={dismiss} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50">
              <X className="w-3.5 h-3.5" /> Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
