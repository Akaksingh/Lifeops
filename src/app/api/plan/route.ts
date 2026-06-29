import { NextRequest, NextResponse } from 'next/server';
import { isPro, setPro } from '@/lib/billing';

export const dynamic = 'force-dynamic';

function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && !key.includes('REPLACE_ME');
}

export async function GET() {
  return NextResponse.json({ pro: isPro(), stripeConfigured: stripeConfigured() });
}

// Dev helper: simulate up/downgrade when Stripe isn't wired yet, so you can
// test the Pro-gated channels (SMS/Call) without completing a real checkout.
export async function POST(req: NextRequest) {
  if (stripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is configured — upgrade via checkout, not the dev toggle.' },
      { status: 400 }
    );
  }
  const { pro } = await req.json();
  setPro(!!pro);
  return NextResponse.json({ ok: true, pro: isPro() });
}
