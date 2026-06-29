'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LemmaClient } from 'lemma-sdk';
import { AuthGuard } from 'lemma-sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LemmaContext, buildLemmaClient, isLemmaConfigured } from '@/lib/lemmaClient';
import NavSidebar from '@/components/NavSidebar';
import FloaterNotification from '@/components/FloaterNotification';

export default function LemmaShell({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<LemmaClient | null>(null);
  // lemma-sdk/react's generated hooks require a TanStack QueryClient at the root.
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!isLemmaConfigured()) return;
    const c = buildLemmaClient();
    // initialize() resolves auth/session state before the guard renders.
    c.initialize().finally(() => setClient(c));
  }, []);

  if (!isLemmaConfigured()) return <SetupScreen />;
  if (!client) return <CenterNote>Connecting to your Lemma pod…</CenterNote>;

  return (
    <QueryClientProvider client={queryClient}>
      <LemmaContext.Provider value={client}>
        <AuthGuard client={client}>
          <NavSidebar />
          <main className="ml-64 min-h-screen">{children}</main>
          <FloaterNotification />
        </AuthGuard>
      </LemmaContext.Provider>
    </QueryClientProvider>
  );
}

function CenterNote({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">
      {children}
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold mb-2">Connect your Lemma pod</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Life Ops stores tasks as rows in a Lemma <strong>Table</strong> and reads/writes them
          through the Lemma SDK. Point the app at your pod to begin:
        </p>
        <ol className="text-sm text-neutral-700 space-y-2 list-decimal pl-5 mb-4">
          <li>
            Create a pod and the <code>tasks</code> table:{' '}
            <code className="text-xs">npm run lemma:setup</code>
          </li>
          <li>
            Set <code>NEXT_PUBLIC_LEMMA_POD_ID</code> (and <code>_API_URL</code> /{' '}
            <code>_AUTH_URL</code>) in <code>.env.local</code>
          </li>
          <li>Restart the dev server and sign in.</li>
        </ol>
        <p className="text-xs text-neutral-400">See the README → “Using Lemma”.</p>
      </div>
    </div>
  );
}
