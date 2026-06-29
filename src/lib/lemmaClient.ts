'use client';

import { createContext, useContext } from 'react';
import { LemmaClient } from 'lemma-sdk';
import type { Task } from './types';

export const TASKS_TABLE = 'tasks';

export function isLemmaConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_LEMMA_POD_ID;
}

/**
 * Build the pod-scoped Lemma client from public env. Constructed lazily in the
 * browser (see LemmaShell) so server prerender never touches it.
 */
export function buildLemmaClient(): LemmaClient {
  return new LemmaClient({
    apiUrl: process.env.NEXT_PUBLIC_LEMMA_API_URL || 'https://api.lemma.work',
    authUrl: process.env.NEXT_PUBLIC_LEMMA_AUTH_URL || 'https://lemma.work/auth',
    podId: process.env.NEXT_PUBLIC_LEMMA_POD_ID,
  });
}

// Single client instance shared across the tree.
export const LemmaContext = createContext<LemmaClient | null>(null);

/** Returns the live client; throws if used outside <LemmaShell> (i.e. before auth). */
export function useLemma(): LemmaClient {
  const client = useContext(LemmaContext);
  if (!client) throw new Error('useLemma must be used within <LemmaShell> once the client is ready.');
  return client;
}

// ── Record ⇄ Task mapping ─────────────────────────────────────────────────────
// Lemma rows carry their own system `id`, real booleans, and our domain columns.
// The UI works with the existing Task shape (string id, 0/1 flags).
function toFlag(v: unknown): number {
  return v === true || v === 1 || v === '1' ? 1 : 0;
}

export function recordToTask(r: Record<string, unknown>): Task {
  return {
    id: String(r.id),
    title: String(r.title ?? ''),
    source: (r.source as Task['source']) ?? 'manual',
    source_url: (r.source_url as string) ?? null,
    due_date: (r.due_date as string) ?? null,
    type: (r.type as Task['type']) ?? 'task',
    done: toFlag(r.done),
    recurring: toFlag(r.recurring),
    followup: toFlag(r.followup),
    created_at: String(r.created_at ?? ''),
    updated_at: String(r.updated_at ?? ''),
    sync_count: Number(r.sync_count ?? 1),
  };
}

/** A row is still "open" (kept in the live, done=false view). */
export function isOpenRow(r: Record<string, unknown>): boolean {
  return toFlag(r.done) === 0;
}
