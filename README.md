# Beyond.Trades — production foundation (Next.js 15 + Vercel)

This is the second development phase of Beyond.Trades: public site, member authentication foundation, premium subscription scaffolding, a Supabase data model with row-level security, and a curated public track-record route.

## Product decisions
- Audience: public website + registered trader workspace.
- Access: free account + paid Premium membership.
- Courses: included in a recurring monthly membership (Stripe subscription scaffold).
- Brand: Beyond.Trades, black and gold.

## Stack
- Next.js App Router + TypeScript, deployed on Vercel.
- Supabase Auth (cookie-based SSR), Postgres, Row Level Security and Storage.
- Stripe Checkout subscription + signed webhook for membership state.
- Cal.com/Calendly integration remains a follow-up.
- Telegram history is staged for manual review; only verified, approved results belong on the public track record.

## Included in this phase
- Existing black/gold frontend and local prototype tools.
- `/login`: Supabase email/password sign-in and free account registration.
- `/dashboard`: authenticated member landing page.
- `/membership`: free vs premium offer and recurring Stripe checkout initiation.
- `/api/billing/checkout`: server-side subscription Checkout Session creation.
- `/api/stripe/webhook`: signature-verified Stripe webhook and membership-tier sync.
- `/track-record`: public list of verified and published trade records only.
- `/admin/telegram-imports`: admin-only view of staged Telegram import records.
- `supabase/schema.sql`: tables, indexes, RLS policies and storage buckets.
- `.env.example`: environment variable template.

## Setup checklist

### 1. Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication settings, configure the site URL and allowed redirect URLs for local and production domains.
4. Copy Project URL, anon/public key and service-role key into `.env.local` (service-role key must remain server-only).
5. Create the first account through `/login`.
6. Promote the site owner to admin manually in SQL:
   `update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';`
7. Never expose the service-role key in browser code or a `NEXT_PUBLIC_` variable.

### 2. Stripe
1. Create a recurring monthly Premium Price in Stripe.
2. Add its Price ID as `STRIPE_PREMIUM_PRICE_ID`.
3. Configure a webhook endpoint at `https://YOUR_DOMAIN/api/stripe/webhook`.
4. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
5. Add the signing secret as `STRIPE_WEBHOOK_SECRET`.
6. Test successful checkout, failed payment, cancellation, renewal and webhook retries before enabling paid access.
7. Publish clear price, renewal, cancellation and refund terms before collecting payment.

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY` (server only)
- `STRIPE_WEBHOOK_SECRET` (server only)
- `STRIPE_PREMIUM_PRICE_ID`

Never commit `.env.local`. Configure the same variables separately for Development, Preview and Production in Vercel, then redeploy after changing them.

### 4. Run and deploy
```bash
npm install
npm run dev
npm run typecheck
npm run build
```
Push to GitHub, import the repository into Vercel, add environment variables, deploy a Preview, test, then promote to Production. Vercel supports separate Local, Preview and Production environments.

## Important unfinished production work
This is not yet a complete production launch:
- The original `/` journal and partner management prototype still uses browser `localStorage`; migrate trade CRUD and partner CRUD to Supabase before treating it as the live member system.
- Implement full admin CRUD, role-management controls, audit logging and MFA for administrators.
- Add server-side booking creation, spam protection, confirmation emails and calendar integration.
- Add lesson progress, gated course video delivery and membership entitlement checks on every premium API/data route.
- Complete Stripe customer portal, idempotent webhook event ledger, failed-payment grace rules and cancellation UX.
- Implement actual Telegram export parsing, media upload, duplicate detection, reviewer approval and publishing actions. No channel history is included or imported by this source bundle.
- Add automated tests, monitoring, backups, rate limiting, security headers and data retention/deletion workflows.
- Validate risk/position calculations per instrument, contract size, tick value, account currency and broker before any live-use claims.
- Replace sample partner listings with verified legal entities, current terms and clearly labelled affiliate relationships.
- Legal counsel must review the trading risk, affiliate, privacy, terms, subscription and education disclosures for the operating entity and target jurisdictions.

## Telegram track-record process
1. Export the BTCBeyond_the_chart channel from Telegram Desktop in JSON format with media.
2. Upload the export archive to the project owner/admin using a secure import workflow.
3. Parse each post and retain original message ID, timestamp, text, image/video assets and source URL.
4. Classify each post as analysis, setup, open trade, update, closed win, closed loss, breakeven or cancelled.
5. Have a human reviewer verify entry/SL/TP and outcome from the full sequence; do not infer an outcome from a screenshot alone.
6. Publish only verified records. Keep the original post link and chart evidence attached.

## Security notes
- RLS is enabled on user and business tables.
- Profile role and membership tier are server-managed; client-side profile updates are intentionally not permitted.
- Stripe webhook uses signature verification and Supabase service role only on the server.
- Review RLS policies and test them with separate member and admin accounts before launch.
