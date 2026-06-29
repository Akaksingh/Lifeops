import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secretKey || secretKey.includes('REPLACE_ME') || !priceId || priceId.includes('REPLACE_ME')) {
    return NextResponse.json(
      { error: 'Stripe not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secretKey);
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/settings?upgraded=1#billing`,
      cancel_url: `${base}/settings#billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
