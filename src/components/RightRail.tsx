'use client';

import { useEffect, useState } from 'react';
import { AlarmClock, Bell, Mail, MessageSquare, Phone, Plus, Sparkles } from 'lucide-react';
import { Task, shortDue, dueStatus, DUE_DOT, todayStr } from '@/lib/types';

export default function RightRail({
  tasks,
  onAdd,
}: {
  tasks: Task[];
  onAdd: (title: string) => Promise<void>;
}) {
  const today = todayStr();
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today);
  const focus = [...tasks]
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 3);

  const [quick, setQuick] = useState('');
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!quick.trim()) return;
    await onAdd(quick.trim());
    setQuick('');
  }

  function digestPayload() {
    const titles = (arr: Task[]) => arr.map((t) => ({ title: t.title }));
    return {
      overdue: titles(overdue),
      today: titles(tasks.filter((t) => t.due_date === today)),
      followups: titles(tasks.filter((t) => t.followup)),
    };
  }

  return (
    <div className="w-80 shrink-0 space-y-4">
      {/* Your Focus */}
      <Card>
        <CardTitle icon={<Sparkles className="w-4 h-4 text-amber-500" />}>Your Focus</CardTitle>
        <div className="space-y-1.5 mt-2">
          {focus.length === 0 && <p className="text-sm text-neutral-400">Nothing scheduled.</p>}
          {focus.map((t) => {
            const s = dueStatus(t.due_date) ?? 'future';
            return (
              <div key={t.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-neutral-800 truncate pr-2">{t.title}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-neutral-500">{shortDue(t.due_date)}</span>
                  <span className={`w-2 h-2 rounded-full ${DUE_DOT[s]}`} />
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Overdue */}
      <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-semibold">Overdue</span>
          <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">
            {overdue.length}
          </span>
        </div>
        <AlarmClock className="w-5 h-5 text-red-400" />
      </div>

      {/* Quick Add */}
      <Card>
        <CardTitle icon={<Plus className="w-4 h-4 text-neutral-500" />}>Quick Add</CardTitle>
        <form onSubmit={add} className="flex items-center gap-2 mt-2">
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
            aria-label="Add"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </Card>

      {/* Reminder Channels */}
      <Card>
        <CardTitle>Reminder Channels</CardTitle>
        <div className="space-y-1 mt-2">
          <ReminderChannels digestPayload={digestPayload} />
        </div>
      </Card>

      {/* Footer scene */}
      <div className="rounded-2xl bg-gradient-to-b from-purple-100 to-indigo-100 p-5 text-center">
        <div className="text-3xl mb-1">⛰️🌅</div>
        <p className="text-sm font-medium text-neutral-700">Stay focused.</p>
        <p className="text-xs text-neutral-500">We&apos;ve got your back. 💛</p>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white border border-neutral-200 p-4">{children}</div>;
}

function CardTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
      {icon}
      {children}
    </div>
  );
}

function ReminderChannels({ digestPayload }: { digestPayload: () => unknown }) {
  const [floater, setFloater] = useState(false);
  const [email, setEmail] = useState(false);

  useEffect(() => {
    setFloater(localStorage.getItem('lifeops:floater') === '1');
    setEmail(localStorage.getItem('lifeops:emailDigest') === '1');
  }, []);

  async function toggleFloater() {
    const next = !floater;
    setFloater(next);
    localStorage.setItem('lifeops:floater', next ? '1' : '0');
    if (next && 'Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  async function toggleEmail() {
    const next = !email;
    setEmail(next);
    localStorage.setItem('lifeops:emailDigest', next ? '1' : '0');
    if (next) {
      const res = await fetch('/api/remind/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(digestPayload()),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed' }));
        alert(`Email digest: ${error}`);
        setEmail(false);
        localStorage.setItem('lifeops:emailDigest', '0');
      }
    }
  }

  return (
    <>
      <ChannelRow icon={<Bell className="w-4 h-4" />} label="Floater (Browser)" on={floater} onToggle={toggleFloater} />
      <ChannelRow icon={<Mail className="w-4 h-4" />} label="Email Digest" on={email} onToggle={toggleEmail} />
      <ChannelRow icon={<MessageSquare className="w-4 h-4" />} label="SMS (Twilio)" pro />
      <ChannelRow icon={<Phone className="w-4 h-4" />} label="Phone Call" pro />
    </>
  );
}

function ChannelRow({
  icon,
  label,
  on,
  onToggle,
  pro,
}: {
  icon: React.ReactNode;
  label: string;
  on?: boolean;
  onToggle?: () => void;
  pro?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-2 text-sm text-neutral-700">
        <span className="text-neutral-400">{icon}</span>
        {label}
      </span>
      {pro ? (
        <a
          href="/settings#billing"
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold"
        >
          PRO
        </a>
      ) : (
        <button
          onClick={onToggle}
          className={`w-9 h-5 rounded-full px-0.5 flex items-center transition ${
            on ? 'bg-purple-500 justify-end' : 'bg-neutral-300 justify-start'
          }`}
          aria-label={`Toggle ${label}`}
        >
          <span className="w-4 h-4 bg-white rounded-full" />
        </button>
      )}
    </div>
  );
}
