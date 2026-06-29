// Creates the Lemma `tasks` table in your pod via the Lemma SDK.
//
// Usage:
//   1) lemma auth login            (or otherwise obtain an access token)
//   2) put NEXT_PUBLIC_LEMMA_POD_ID + LEMMA_ACCESS_TOKEN in .env.local
//   3) npm run lemma:setup
//
// LEMMA_ACCESS_TOKEN is a pod-scoped bearer token for the logged-in user. We
// inject it via setTestingToken (the SDK's headless token hook) so this script
// can run outside a browser session.

import { readFileSync, existsSync } from 'node:fs';
import { LemmaClient, setTestingToken } from 'lemma-sdk';

// Minimal .env.local loader (no dependency).
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const podId = process.env.NEXT_PUBLIC_LEMMA_POD_ID;
const apiUrl = process.env.NEXT_PUBLIC_LEMMA_API_URL || 'https://api.lemma.work';
const authUrl = process.env.NEXT_PUBLIC_LEMMA_AUTH_URL || 'https://lemma.work/auth';
const token = process.env.LEMMA_ACCESS_TOKEN;

if (!podId) {
  console.error('✗ Set NEXT_PUBLIC_LEMMA_POD_ID in .env.local first.');
  process.exit(1);
}
if (!token) {
  console.error('✗ Set LEMMA_ACCESS_TOKEN (a pod bearer token) in .env.local first.');
  process.exit(1);
}

const schema = JSON.parse(readFileSync(new URL('../lemma/tasks.table.json', import.meta.url), 'utf8'));

const client = new LemmaClient({ apiUrl, authUrl, podId });
setTestingToken(token);

try {
  await client.initialize();
  const existing = await client.tables.list().catch(() => ({ items: [] }));
  const names = (existing.items ?? existing ?? []).map((t) => t.name ?? t.table_name);
  if (names.includes('tasks')) {
    console.log('✓ tasks table already exists — nothing to do.');
    process.exit(0);
  }
  await client.tables.create(schema);
  console.log('✓ Created the "tasks" table in pod', podId);
} catch (err) {
  console.error('✗ Setup failed:', err?.message || err);
  console.error('  If column types are rejected, adjust lemma/tasks.table.json to your pod\'s supported types.');
  process.exit(1);
}
