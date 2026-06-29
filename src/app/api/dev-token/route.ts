import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Dev-only: serves a *fresh* bearer token so the browser app can authenticate
// against hosted Lemma without a shareable session cookie (see the SDK note in
// auth.js → checkAuth about localhost apps not sharing cookies).
//
// We run `lemma auth print-token` live on each request — the CLI refreshes the
// access token automatically — so the token is never stale and the user never
// sees the Sign In screen in local dev. Falls back to the .lemma-dev-token file
// or LEMMA_ACCESS_TOKEN if the CLI isn't available.
//
// Returns { token: null } in production, where a real same-site cookie session
// (or a deployed auth domain) is expected instead.
export const dynamic = 'force-dynamic';

// Cache the minted token briefly so we don't spawn the CLI on every poll.
let cache: { token: string; at: number } | null = null;
const CACHE_MS = 30 * 60 * 1000; // 30 min (tokens are valid ~1h)

function mintFreshToken(): string | null {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.token;
  try {
    const token = execSync('lemma auth print-token', {
      encoding: 'utf8',
      shell: true as unknown as string,
      timeout: 15000,
    })
      .trim()
      .replace(/\r?\n/g, '');
    if (token) {
      cache = { token, at: Date.now() };
      return token;
    }
  } catch {
    // CLI not on PATH / not logged in — fall through to file/env.
  }
  return null;
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ token: null });
  }
  // 1) Fresh from the CLI (auto-refreshing — best path).
  const fresh = mintFreshToken();
  if (fresh) return NextResponse.json({ token: fresh });

  // 2) Fallbacks: the gitignored file, then the env var.
  try {
    const token = existsSync('.lemma-dev-token')
      ? readFileSync('.lemma-dev-token', 'utf8').trim()
      : (process.env.LEMMA_ACCESS_TOKEN || '').trim();
    return NextResponse.json({ token: token || null });
  } catch {
    return NextResponse.json({ token: null });
  }
}
