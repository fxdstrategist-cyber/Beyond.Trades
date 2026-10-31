import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return NextResponse.json({ error:'Billing webhook is not configured.' }, { status:503 });

  const stripe = new Stripe(secret);
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error:'Missing signature.' }, { status:400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error:'Invalid webhook signature.' }, { status:400 });
  }

  const admin = createAdminClient();
  const upsertSubscription = async (subscription: Stripe.Subscription) => {
    const userId = subscription.metadata.user_id;
    if (!userId) throw new Error('Subscription missing user_id metadata.');
    const item = subscription.items.data[0];
    const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
    const { error: subscriptionError } = await admin.from('subscriptions').upsert({
      user_id:userId,
      stripe_subscription_id:subscription.id,
      stripe_customer_id:typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      status:subscription.status,
      price_id:item?.price.id ?? null,
      current_period_end:periodEnd,
      cancel_at_period_end:subscription.cancel_at_period_end,
    }, { onConflict:'stripe_subscription_id' });
    if (subscriptionError) throw subscriptionError;
    const active = ['active','trialing'].includes(subscription.status);
    const { error: profileError } = await admin.from('profiles').update({ membership_tier:active ? 'premium' : 'free' }).eq('id',userId);
    if (profileError) throw profileError;
  };

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        await upsertSubscription(subscription);
      }
      break;
    }
  }
  return NextResponse.json({ received:true });
}
