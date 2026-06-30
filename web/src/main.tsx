import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGuard } from 'lemma-sdk/react'
import { lemmaClient } from './lemma-client'
import { useHashRoute } from './lib/router'
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
  const page =
    path === '/calendar' ? <CalendarPage /> :
    path === '/sources' ? <SourcesPage /> :
    path === '/insights' ? <InsightsPage /> :
    path === '/settings' ? <Settings /> :
    <Dashboard />

  return (
    <>
      <NavSidebar />
      <main className="ml-64 min-h-screen">{page}</main>
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
