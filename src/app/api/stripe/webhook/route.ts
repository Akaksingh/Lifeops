import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { setPro } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret || secretKey.includes('REPLACE_ME')) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  const body = await req.text(); // raw body required for signature verification
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature error: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      setPro(true);
      break;
    case 'customer.subscription.deleted':
      setPro(false);
      break;
  }

  return NextResponse.json({ received: true });
}
