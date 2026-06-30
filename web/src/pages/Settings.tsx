import { Crown, Mail, CalendarPlus, ServerOff } from 'lucide-react';

// In the Next.js build, Settings drives Stripe checkout, plan state (server-side
// SQLite), Resend email digests, and Google Calendar push. None of those have a
// server in the hosted client app, so this page documents the plan state and
// points at the server build for the paid/integration tiers.
export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-neutral-500 mb-6">Plan, reminders, and integrations.</p>

      <div className="mb-5 flex items-start gap-3 text-sm px-3 py-2.5 rounded-lg bg-neutral-100 text-neutral-600">
        <ServerOff className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" />
        <span>
          Billing and outbound reminders (Stripe, Resend, Twilio, Google Calendar push) run in the
          Next.js server build. This hosted app is client-only, so those actions live there.
        </span>
      </div>

      {/* Billing */}
      <section id="billing" className="rounded-xl bg-white border border-neutral-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold">Plan</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-600">
            Free
          </span>
        </div>
        <p className="text-sm text-neutral-500">
          Pro unlocks SMS and call reminders (₹299/month). Floater notifications are free and work right
          here in the browser. Upgrade to Pro from the server build, where Stripe checkout is wired up.
        </p>
      </section>

      {/* Reminders + integrations */}
      <section className="rounded-xl bg-white border border-neutral-200 p-5 space-y-3">
        <h2 className="font-semibold mb-1">Reminders &amp; integrations</h2>

        <InfoRow
          icon={<Mail className="w-4 h-4" />}
          title="Email digest"
          desc="Daily briefing to your inbox — sent via Resend from the server build."
        />
        <InfoRow
          icon={<CalendarPlus className="w-4 h-4" />}
          title="Push to Calendar"
          desc="Create Google Calendar events for dated tasks — runs in the server build."
        />
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="text-neutral-500">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
        Server build
      </span>
    </div>
  );
}
