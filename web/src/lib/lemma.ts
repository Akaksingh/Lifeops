// Shared Lemma client + Record ⇄ Task mapping for the hosted app.
//
// In a deployed Lemma app the host serves the SDK config and the browser is
// authenticated to the pod (same-site cookie on the app subdomain), so we use
// the module-singleton client directly — no token injection, no React context.
import { lemmaClient } from '../lemma-client';
import type { Task } from './types';

export { lemmaClient };
export const TASKS_TABLE = 'tasks';

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
