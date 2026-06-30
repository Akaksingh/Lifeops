import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useLiveRecords, AgentThread } from 'lemma-sdk/react';
import type { UseConversationMessagesResult } from 'lemma-sdk/react';
import { lemmaClient, TASKS_TABLE, recordToTask, isOpenRow } from '../lib/lemma';
import { Task, todayStr, shortDue, dueStatus, DUE_DOT } from '../lib/types';

// Floating lemon launcher → slide-over "LIA" assistant: live task summary +
// pending list + a chat backed by the pod's `lia` agent (which reads/writes the
// tasks table itself). The agent is the brain; Lemma is the infra.
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);

  const { records } = useLiveRecords({
    client: lemmaClient,
    tableName: TASKS_TABLE,
    limit: 500,
    reconcile: 'merge',
  });
  const tasks: Task[] = useMemo(() => records.filter(isOpenRow).map(recordToTask), [records]);
  const today = todayStr();
  const overdue = useMemo(() => tasks.filter((t) => t.due_date && t.due_date < today), [tasks, today]);
  const dueToday = useMemo(() => tasks.filter((t) => t.due_date === today), [tasks, today]);
  const pending = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
        .slice(0, 5),
    [tasks]
  );

  return (
    <>
      {!open && <Launcher overdue={overdue.length} onClick={() => setOpen(true)} />}
      {open && (
        <aside className="fixed right-0 top-0 h-screen w-[390px] max-w-[92vw] z-50 bg-white border-l border-neutral-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <LemonFace className="w-9 h-9" />
            <div className="leading-tight flex-1">
              <div className="text-[15px] font-semibold text-neutral-900">LIA</div>
              <div className="text-[11px] text-neutral-500">Your Life Ops assistant</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/70 text-neutral-500" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live summary */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="grid grid-cols-3 gap-2">
              <Chip value={overdue.length} label="Overdue" tone="red" />
              <Chip value={dueToday.length} label="Due today" tone="amber" />
              <Chip value={tasks.length} label="Open loops" tone="green" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1.5">Pending</p>
              {pending.length === 0 ? (
                <p className="text-sm text-neutral-400">Nothing pending — you&apos;re clear. 🍋</p>
              ) : (
                <div className="space-y-1">
                  {pending.map((t) => {
                    const s = dueStatus(t.due_date) ?? 'future';
                    return (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-neutral-700 truncate">{t.title}</span>
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-neutral-500">{shortDue(t.due_date)}</span>
                          <span className={`w-2 h-2 rounded-full ${DUE_DOT[s]}`} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat with the lia agent */}
          <AgentThread client={lemmaClient} podId={lemmaClient.podId} agentName="lia">
            {(thread) => <Chat thread={thread} />}
          </AgentThread>
        </aside>
      )}
    </>
  );
}

function Launcher({ overdue, onClick }: { overdue: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-white border border-neutral-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition group"
      aria-label="Open LIA assistant"
    >
      <span className="relative">
        <LemonFace className="w-9 h-9" />
        {overdue > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {overdue}
          </span>
        )}
      </span>
      <span className="text-sm font-semibold text-neutral-800">Ask LIA</span>
      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
    </button>
  );
}

// The lemon avatar — real artwork if present, else a drawn lemon face.
function LemonFace({ className = 'w-9 h-9' }: { className?: string }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return <img src="/logo.png" alt="LIA" className={`${className} object-contain`} onError={() => setOk(false)} />;
  }
  return <span className={`${className} grid place-items-center text-2xl`}>🍋</span>;
}

function Chip({ value, label, tone }: { value: number; label: string; tone: 'red' | 'amber' | 'green' }) {
  const tones: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className={`rounded-xl ${tones[tone]} px-2 py-1.5 text-center`}>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="text-[10px] font-medium mt-0.5">{label}</div>
    </div>
  );
}

function hasFinalReply(msgs: { role?: string; kind?: string; text?: string | null }[]) {
  return msgs.some(
    (m) => (m.role ?? '').toLowerCase() === 'assistant' && m.kind === 'TEXT' && (m.text ?? '').trim().length > 0
  );
}

function Chat({ thread }: { thread: UseConversationMessagesResult }) {
  const [draft, setDraft] = useState('');
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only the user's prompts and LIA's text answers (skip thinking/tool chatter).
  // Role can come back upper- or lower-case, so normalise.
  const visible = useMemo(
    () =>
      thread.messages.filter((m) => {
        const role = (m.role ?? '').toLowerCase();
        const isText = m.kind === 'TEXT' && (m.text ?? '').trim().length > 0;
        return (role === 'user' || role === 'assistant') && isText;
      }),
    [thread.messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible.length, thread.streamingText, thread.isRunning]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    setLocalErr(null);
    setBusy(true);
    try {
      // sendMessage throws if no conversation exists yet — create one first.
      // Inject today's date so the agent resolves "tomorrow"/"Friday" correctly.
      let convId = thread.conversationId;
      if (!convId) {
        const conv = await thread.createConversation({
          instructions: `Today's date is ${todayStr()}. Resolve relative dates like "today", "tomorrow", "Friday", or "next week" against it.`,
        });
        convId = conv?.id ?? null;
      }
      if (!convId) {
        setLocalErr('Could not start a conversation.');
        return;
      }
      // Kick off the run. The POST stream only echoes the user message and the
      // reply arrives out-of-band, so don't rely on it — poll the conversation.
      await thread.sendMessage(text, { conversationId: convId, syncOnTurnEnd: true }).catch((err) => {
        // a stream hiccup here is fine; the run still proceeds server-side
        console.warn('sendMessage stream ended early:', err);
      });
      const before = thread.messages.length;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const msgs = await thread.refresh({ conversationId: convId });
        if (hasFinalReply(msgs) && msgs.length > before) break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLocalErr(msg);
      console.error('LIA send failed:', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {visible.length === 0 && !thread.isRunning && (
          <div className="text-sm text-neutral-500 bg-purple-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
            Hi, I&apos;m <strong>LIA</strong> 🍋 — tell me what&apos;s on your plate and I&apos;ll track it.
            Try <em>“reply to Acme by Friday and call mom tomorrow”</em>, or ask <em>“what&apos;s overdue?”</em>
          </div>
        )}

        {visible.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-purple-500 text-white rounded-tr-sm'
                  : 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {(busy || thread.isRunning) && (
          <div className="flex justify-start">
            <div className="max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-neutral-100 text-neutral-500 inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              {thread.streamingText ? thread.streamingText : 'LIA is thinking…'}
            </div>
          </div>
        )}

        {(localErr || thread.error) && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {localErr || thread.error?.message}
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-neutral-100 p-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tell LIA what to track…"
          className="flex-1 text-sm px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="p-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}
