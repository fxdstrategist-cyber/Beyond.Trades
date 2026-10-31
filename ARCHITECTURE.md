# Beyond.Trades architecture

## Public surface
Landing page, partner directory, verified BTC track record, course preview, legal disclosures, booking entry point.

## Authenticated surface
Supabase Auth session in secure cookies. Free members can manage their private journal, risk plans and preferences. Premium members receive additional analytics and course entitlements. All private records are scoped by `auth.uid()` via Postgres RLS.

## Admin surface
Admin role is stored in `profiles.role`, set only by trusted server/database administration. Admins manage partner listings, course content, bookings and staged Telegram imports. All publish actions should be auditable.

## Billing
Stripe recurring subscription is the billing source of truth. Signed webhook events synchronize subscription status into Supabase. Premium entitlements must be checked server-side; never trust a client flag or a successful redirect alone.

## Data domains
- Identity: profiles
- Trader workspace: trades
- Public evidence: public_track_record
- Import staging: telegram_imports
- Directory: partners
- Learning: courses, course_lessons, course_enrollments
- Monetization: subscriptions
- Service workflow: bookings
- Media: partner-assets, public-trade-record, trade-private, telegram-imports

## Key invariants
1. Private journal rows never become public automatically.
2. Telegram posts are not considered results until verified by a reviewer.
3. Admin and membership entitlements cannot be self-assigned by a member.
4. Trading performance shown publicly must retain source context and disclose methodology.
5. Subscription access follows signed server-side billing events, not browser state.
