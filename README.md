# Life Ops — personal command centre (built on Lemma)

Extracts tasks, deadlines, follow-ups and open loops from Gmail, Notion, Google
Drive and Google Calendar and turns them into **rows in a Lemma Table** you act
on from one dashboard — with a persistent sidebar, smart reminders, and a paid
SMS/call tier.

**Stack:** [Lemma SDK](https://github.com/lemma-work/lemma-platform) (data + auth)
· Next.js 14 · Anthropic SDK (extraction + briefing) · Resend · Twilio · Stripe.

> Why Lemma fits: Lemma's core idea is that agent output shows up as **structured
> table rows, not chat**. Life Ops' open loops *are* rows — so Lemma is the store
> and auth layer, not a bolt-on.

---

## How Lemma is used (the core loop)

| Lemma primitive | Where |
|---|---|
| **Table** `tasks` | The single source of truth for every task row (`lemma/tasks.table.json`). |
| **Records CRUD via the SDK** | `client.records.create/update` for sync inserts, quick-add, and mark-done. |
| **React hooks** | `useLiveRecords` (live WebSocket task list, no polling), `useCreateRecord`, `useUpdateRecord`, `useAuth` — see `src/app/page.tsx`, `src/components/RightRail.tsx`, `FloaterNotification.tsx`. |
| **AuthGuard** | `src/components/LemmaShell.tsx` gates the whole app on pod sign-in + membership. |
| **Headless SDK** | `scripts/lemma-setup.mjs` creates the `tasks` table via `client.tables.create` (auth injected with `setTestingToken`). |

The browser is authenticated to the pod, so **all task writes go through the Lemma
SDK client-side** (RLS-scoped to the user). The only server work is stateless:
`/api/extract` (AI extraction → candidate tasks), `/api/briefing` (counts → text),
and the reminder/billing routes.

---

## How to run

### Prerequisites
- **Node.js 18.17+** (tested on v22) and npm.
- Install dependencies once:
  ```bash
  cd life-ops
  npm install
  ```

### A. Start it now (no pod — see it immediately)
```bash
npm run dev      # → http://localhost:3000
```
With no Lemma pod configured the app shows a **“Connect your Lemma pod”** screen.
That is expected, not an error — it confirms the app builds and runs. The full
dashboard is gated by Lemma sign-in (AuthGuard), so finish section B to see it.

Want to confirm the production build too?
```bash
npm run build    # type-checks + compiles (should exit 0)
npm run start    # serve the production build
```

### B. Full dashboard (point it at a Lemma pod)

**1. Stand up Lemma + create a pod**
```bash
# hosted (api.lemma.work) — or run the open-source stack locally:
curl -fsSL https://raw.githubusercontent.com/lemma-work/lemma-platform/main/install.sh | bash   # macOS/Linux
# Windows: iwr https://raw.githubusercontent.com/lemma-work/lemma-platform/main/install.ps1 | iex
uv tool install lemma-terminal
lemma auth login
lemma pod create life-ops --with-starter
```

**2. Point the app at your pod — edit `.env.local`**
```
NEXT_PUBLIC_LEMMA_POD_ID=<your pod id>
NEXT_PUBLIC_LEMMA_API_URL=https://api.lemma.work     # or your local stack URL
NEXT_PUBLIC_LEMMA_AUTH_URL=https://lemma.work/auth
LEMMA_ACCESS_TOKEN=<pod bearer token>                # used only by lemma:setup
```

**3. Create the `tasks` table, then run**
```bash
npm run lemma:setup    # creates the Lemma Table from lemma/tasks.table.json
npm run dev            # AuthGuard sign-in → live dashboard backed by your pod
```

**4. Use it.** Sign in, then click **Sync** to pull tasks (mock data by default —
see *Connectors* below) into your Lemma `tasks` table; the live hook renders them
instantly. Quick-add and mark-done write straight to Lemma.

> **Windows note:** all commands work in PowerShell. Run them from the
> `life-ops` folder (`cd D:\aitask_scheduler_gappy\life-ops`).

### Optional services (all degrade gracefully if unset)
| Want | Set in `.env.local` |
|---|---|
| Real AI briefing (else templated) | `ANTHROPIC_API_KEY` |
| Email digest | `RESEND_API_KEY`, `DIGEST_TO_EMAIL` |
| SMS reminders (Pro) | `TWILIO_*`, `USER_PHONE_NUMBER` |
| Billing / Pro upgrade | `STRIPE_*`, `STRIPE_PRICE_ID` |

---

## Connectors (Gmail / Calendar / Notion / Drive)

Ships in **stub mode** (`USE_MOCK_SOURCES=true`): extraction returns realistic
mock tasks so the loop is demoable immediately. The **real path is already
written** correctly against the Anthropic MCP connector (beta `mcp-client-2025-11-20`,
`mcp_toolset` per server, per-server OAuth `authorization_token`) in
`src/lib/agent.ts` → `runRealExtractionCycle`. Going live = real `ANTHROPIC_API_KEY`,
a Google/Notion OAuth flow to mint tokens, then `USE_MOCK_SOURCES=false`. The
Google MCP endpoints in `.env.local` are real Google services.

---

## Honest status

- Builds clean (`npm run build`, exit 0) against **lemma-sdk 0.5.2**, using its
  real API (verified against the installed package, not guessed).
- **Not yet run against a live pod** from this machine. If `lemma:setup` rejects a
  column `type`, adjust `lemma/tasks.table.json` to your pod's supported types.
- Billing/plan state stays in local SQLite (`src/lib/billing.ts`) — server-side app
  state, separate from the per-user task rows in Lemma.
- Recurring sync is best modelled as a **Lemma Schedule** (`useCreateSchedule`)
  triggering an agent/workflow — a natural next step beyond this submission.

---

## API routes (all stateless — task state lives in Lemma)

| Route | Method | Purpose |
|---|---|---|
| `/api/extract` | GET | AI extraction → candidate tasks (browser persists into Lemma) |
| `/api/briefing` | POST | Counts → AI briefing text (template fallback, no key needed) |
| `/api/remind/email` | POST | Email digest (Resend) from posted task lists |
| `/api/remind/sms` | POST | SMS (Twilio) — **Pro-gated** |
| `/api/calendar/push` | POST | Push dated tasks to Google Calendar |
| `/api/plan`, `/api/stripe/*` | — | Billing / Pro plan |
