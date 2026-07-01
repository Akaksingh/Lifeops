import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import { AuthGuard } from 'lemma-sdk/react'
import { lemmaClient } from './lemma-client'
import { useHashRoute } from './lib/router'
import { LemonLogo } from './components/Art'
import NavSidebar from './components/NavSidebar'
import FloaterNotification from './components/FloaterNotification'
import AssistantWidget from './components/AssistantWidget'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import SourcesPage from './pages/Sources'
import InsightsPage from './pages/Insights'
import Settings from './pages/Settings'
import './styles.css'

// One QueryClient per app — the generated lemma-sdk/react hooks are TanStack-Query
// hooks (cache + dedupe reads, auto-refresh lists after a mutation). Wrap once.
const queryClient = new QueryClient()

function Shell() {
  const { path } = useHashRoute()
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false)
  }, [path])

  const page =
    path === '/calendar' ? <CalendarPage /> :
    path === '/sources' ? <SourcesPage /> :
    path === '/insights' ? <InsightsPage /> :
    path === '/settings' ? <Settings /> :
    <Dashboard />

  return (
    <>
      {/* Mobile top bar — hamburger + brand, hidden on md+ where the sidebar is always shown */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center gap-3 px-4 bg-white/90 backdrop-blur border-b border-neutral-200/70">
        <button
          onClick={() => setNavOpen(true)}
          className="p-1.5 -ml-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <LemonLogo className="w-7 h-7" />
        <span className="font-extrabold text-[17px] tracking-tight text-neutral-900">Life Ops</span>
      </div>

      {/* Backdrop behind the drawer on mobile */}
      {navOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-neutral-900/40"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      <NavSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="md:ml-64 min-h-screen pt-14 md:pt-0">{page}</main>
      <FloaterNotification />
      <AssistantWidget />
    </>
  )
}

function CenterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">
      {children}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGuard
        client={lemmaClient}
        loadingFallback={<CenterNote>Connecting to your Lemma pod…</CenterNote>}
      >
        <Shell />
      </AuthGuard>
    </QueryClientProvider>
  </React.StrictMode>,
)
