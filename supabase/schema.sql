-- Beyond.Trades production schema
-- Run this in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;

create type public.app_role as enum ('member','admin');
create type public.membership_tier as enum ('free','premium');
create type public.trade_direction as enum ('buy','sell');
create type public.trade_outcome as enum ('open','win','loss','breakeven','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'member',
  membership_tier public.membership_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  traded_at timestamptz not null,
  symbol text not null,
  direction public.trade_direction not null,
  strategy text,
  entry_price numeric(24,10) not null,
  stop_loss numeric(24,10),
  take_profit numeric(24,10),
  exit_price numeric(24,10),
  risk_percent numeric(8,4),
  risk_amount numeric(20,4),
  pnl numeric(20,4),
  r_multiple numeric(12,4),
  outcome public.trade_outcome not null default 'open',
  setup_notes text,
  review_notes text,
  psychology_before text,
  psychology_after text,
  screenshot_path text,
  is_premium_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trades_user_date_idx on public.trades(user_id, traded_at desc);

-- Curated, verified channel record. Only approved records become public.
create table public.public_track_record (
  id uuid primary key default gen_random_uuid(),
  source_platform text not null default 'telegram',
  source_channel text not null,
  source_message_id text not null,
  published_at timestamptz not null,
  symbol text,
  direction public.trade_direction,
  entry_text text,
  stop_loss_text text,
  take_profit_text text[],
  result_label text not null default 'unverified'
    check (result_label in ('unverified','win','loss','breakeven','cancelled','analysis')),
  result_r text,
  image_paths text[] not null default '{}',
  source_url text,
  notes text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(source_platform, source_channel, source_message_id)
);
create index public_track_record_published_idx on public.public_track_record(is_published, published_at desc);

-- Staging table for Telegram export/import. Raw content remains private until reviewed.
create table public.telegram_imports (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid not null references public.profiles(id) on delete cascade,
  source_channel text not null,
  source_message_id text not null,
  message_date timestamptz,
  raw_text text,
  media_paths text[] not null default '{}',
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending','parsed','needs_review','approved','rejected')),
  parsed_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(imported_by, source_channel, source_message_id)
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('broker','prop_firm')),
  description text,
  official_url text not null,
  affiliate_url text,
  logo_path text,
  hero_image_path text,
  region_availability text[] not null default '{}',
  regulation_notes text,
  risk_notes text,
  disclosure text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_image_path text,
  monthly_price_id text,
  is_premium boolean not null default true,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  sort_order int not null default 0,
  is_published boolean not null default false
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique not null,
  price_id text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions(user_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  session_type text not null,
  preferred_at timestamptz,
  timezone text,
  contact_handle text,
  notes text,
  status text not null default 'requested'
    check (status in ('requested','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  status text not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.public_track_record enable row level security;
alter table public.telegram_imports enable row level security;
alter table public.partners enable row level security;
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bookings enable row level security;
alter table public.course_enrollments enable row level security;

create policy "Profiles are visible to owner or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
-- Profile role and membership tier are server-managed; no client UPDATE policy is granted.
create policy "Users read own trades" on public.trades
for select using (user_id = auth.uid() or public.is_admin());
create policy "Users create own trades" on public.trades
for insert with check (user_id = auth.uid());
create policy "Users update own trades" on public.trades
for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "Users delete own trades" on public.trades
for delete using (user_id = auth.uid() or public.is_admin());

create policy "Public sees verified published track record" on public.public_track_record
for select using ((is_published = true and verification_status = 'verified') or public.is_admin());
create policy "Admins manage track record" on public.public_track_record
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users see own Telegram imports" on public.telegram_imports
for select using (imported_by = auth.uid() or public.is_admin());
create policy "Users add own Telegram imports" on public.telegram_imports
for insert with check (imported_by = auth.uid());
create policy "Admins review Telegram imports" on public.telegram_imports
for all using (public.is_admin()) with check (public.is_admin());

create policy "Public sees published partners" on public.partners
for select using (is_published = true or public.is_admin());
create policy "Admins manage partners" on public.partners
for all using (public.is_admin()) with check (public.is_admin());

create policy "Public sees published courses" on public.courses
for select using (is_published = true or public.is_admin());
create policy "Public sees published lesson metadata" on public.course_lessons
for select using (
  (is_published = true and exists(select 1 from public.courses c where c.id=course_id and c.is_published=true and c.is_premium=false))
  or public.is_admin()
  or exists(select 1 from public.course_enrollments e where e.course_id=course_id and e.user_id=auth.uid() and e.status='active')
);
create policy "Admins manage courses" on public.courses
for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage lessons" on public.course_lessons
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own subscriptions" on public.subscriptions
for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage subscriptions" on public.subscriptions
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users create bookings" on public.bookings
for insert with check (user_id = auth.uid() or user_id is null);
create policy "Users read own bookings" on public.bookings
for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage bookings" on public.bookings
for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own enrollments" on public.course_enrollments
for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage enrollments" on public.course_enrollments
for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets. Public company artwork; private user screenshots and Telegram archive.
insert into storage.buckets (id, name, public) values
  ('partner-assets','partner-assets',true),
  ('public-trade-record','public-trade-record',true),
  ('trade-private','trade-private',false),
  ('telegram-imports','telegram-imports',false)
on conflict (id) do nothing;

create policy "Public reads partner assets" on storage.objects
for select using (bucket_id = 'partner-assets');
create policy "Admins manage partner assets" on storage.objects
for all using (bucket_id = 'partner-assets' and public.is_admin())
with check (bucket_id = 'partner-assets' and public.is_admin());
create policy "Users manage own trade files" on storage.objects
for all using (bucket_id = 'trade-private' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'trade-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users manage own Telegram imports" on storage.objects
for all using (bucket_id = 'telegram-imports' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'telegram-imports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public reads published track record images" on storage.objects
for select using (bucket_id = 'public-trade-record');
create policy "Admins manage track record images" on storage.objects
for all using (bucket_id = 'public-trade-record' and public.is_admin())
with check (bucket_id = 'public-trade-record' and public.is_admin());
