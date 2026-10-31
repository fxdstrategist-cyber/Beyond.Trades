import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:'Sign in required.' }, { status:401 });

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!secret || !priceId) return NextResponse.json({ error:'Billing is not configured yet.' }, { status:503 });

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode:'subscription',
    line_items:[{ price:priceId, quantity:1 }],
    customer_email:user.email,
    client_reference_id:user.id,
    metadata:{ user_id:user.id, product:'beyond_trades_premium' },
    subscription_data:{ metadata:{ user_id:user.id, product:'beyond_trades_premium' } },
    success_url:`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?billing=success`,
    cancel_url:`${process.env.NEXT_PUBLIC_SITE_URL}/?billing=cancelled`,
  });
  return NextResponse.json({ url:session.url });
}
