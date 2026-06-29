import { NextResponse } from 'next/server';
import { runExtractionCycle } from '@/lib/agent';

export const dynamic = 'force-dynamic';

// Pure extraction: returns candidate tasks (stub or real MCP). The browser, which
// is authenticated to the Lemma pod, dedups by ext_id and writes new rows via the
// Lemma SDK — so all task state lives in Lemma, not on the server.
export async function GET() {
  try {
    const tasks = await runExtractionCycle();
    return NextResponse.json({ ok: true, tasks });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
