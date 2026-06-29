'use client';

import { useEffect, useState } from 'react';
import { Crown, Mail, CalendarPlus, Loader2 } from 'lucide-react';

export default function Settings() {
  const [pro, setPro] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');

  async function loadPlan() {
    const res = await fetch('/api/plan');
    const data = await res.json();
    setPro(data.pro);
    setStripeConfigured(data.stripeConfigured);
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function upgrade() {
    setBusy('upgrade');
    setMsg('');
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    setBusy(null);
    if (data.url) {
      window.location.href = data.url;
    } else {
      setMsg(data.error || 'Checkout failed.');
    }
  }

  async function devToggle(next: boolean) {
    setBusy('toggle');
    await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pro: next }),
    });
    await loadPlan();
    setBusy(null);
  }

  async function sendDigest() {
    setBusy('digest');
    setMsg('');
    const res = await fetch('/api/remind/email', { method: 'POST' });
    const data = await res.json();
    setBusy(null);
    setMsg(res.ok ? 'Digest sent — check your inbox.' : `Digest: ${data.error}`);
  }

  async function pushCalendar() {
    setBusy('calendar');
    setMsg('');
    const res = await fetch('/api/calendar/push', { method: 'POST' });
    const data = await res.json();
    setBusy(null);
    setMsg(res.ok ? `Pushed ${data.created} task(s) to Calendar.` : `Calendar: ${data.error}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-neutral-500 mb-6">Plan, reminders, and integrations.</p>

      {msg && (
        <div className="mb-5 text-sm px-3 py-2 rounded-lg bg-neutral-100 text-neutral-700">{msg}</div>
      )}

      {/* Billing */}
      <section id="billing" className="rounded-xl bg-white border border-neutral-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Plan</h2>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              pro ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {pro ? 'Pro' : 'Free'}
          </span>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Pro unlocks SMS and call reminders (₹299/month). Floater and email digests are free.
        </p>

        {pro ? (
          <p className="text-sm text-green-700">You&apos;re on Pro — SMS and call reminders are unlocked.</p>
        ) : stripeConfigured ? (
          <button
            onClick={upgrade}
            disabled={busy === 'upgrade'}
            className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            {busy === 'upgrade' && <Loader2 className="w-4 h-4 animate-spin" />}
            Upgrade to Pro
          </button>
        ) : (
          <div className="text-sm">
            <p className="text-neutral-500 mb-2">
              Stripe isn&apos;t configured yet. Use the dev toggle to test Pro-gated channels:
            </p>
            <button
              onClick={() => devToggle(!pro)}
              disabled={busy === 'toggle'}
              className="flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy === 'toggle' && <Loader2 className="w-4 h-4 animate-spin" />}
              Simulate upgrade (dev)
            </button>
          </div>
        )}
      </section>

      {/* Reminders + integrations */}
      <section className="rounded-xl bg-white border border-neutral-200 p-5 space-y-3">
        <h2 className="font-semibold mb-1">Reminders &amp; integrations</h2>

        <ActionRow
          icon={<Mail className="w-4 h-4" />}
          title="Email digest"
          desc="Send the daily briefing to your inbox now."
          busy={busy === 'digest'}
          onClick={sendDigest}
          cta="Send digest now"
        />
        <ActionRow
          icon={<CalendarPlus className="w-4 h-4" />}
          title="Push to Calendar"
          desc="Create Google Calendar events for all dated tasks."
          busy={busy === 'calendar'}
          onClick={pushCalendar}
          cta="Push to Calendar"
        />
      </section>
    </div>
  );
}

function ActionRow({
  icon,
  title,
  desc,
  busy,
  onClick,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  busy: boolean;
  onClick: () => void;
  cta: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="text-neutral-500">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-60"
      >
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {cta}
      </button>
    </div>
  );
}
