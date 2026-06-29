import { NextResponse } from 'next/server';
import { runExtractionCycle } from '@/lib/agent';
import { isGoogleConfigured } from '@/lib/google';
import { extractFromGoogle } from '@/lib/googleSources';

export const dynamic = 'force-dynamic';

// Pure extraction: returns candidate tasks. The browser, which is authenticated
// to the Lemma pod, dedups by ext_id and writes new rows via the Lemma SDK — so
// all task state lives in Lemma, not on the server.
//
// When Google is connected (refresh token present), we pull REAL Gmail/Drive/
// Calendar items via the direct API. Otherwise we fall back to the mock/MCP cycle.
export async function GET() {
  try {
    if (isGoogleConfigured()) {
      const tasks = await extractFromGoogle();
      return NextResponse.json({ ok: true, tasks, source: 'google' });
    }
    const tasks = await runExtractionCycle();
    return NextResponse.json({ ok: true, tasks, source: 'mock' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
