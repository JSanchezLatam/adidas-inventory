-- ============================================================
-- Adidas Inventory System — Supabase Schema
-- Run this in your Supabase project SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- SHELVES (Anaqueles)
-- ─────────────────────────────────────────
create table if not exists public.shelves (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,       -- "A1", "B3"
  label      text,                        -- "Anaquel A1 — Zona Running"
  zone       text,                        -- "Running", "Futbol", "Casual"
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  sku         text not null unique,
  barcode     text unique,
  reference   text,
  name        text not null,
  size        text,
  color       text,
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_products_barcode   on public.products (barcode);
create index if not exists idx_products_reference on public.products (reference);
create index if not exists idx_products_name_fts  on public.products using gin(to_tsvector('spanish', name));

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────
-- PRODUCT LOCATIONS
-- ─────────────────────────────────────────
create table if not exists public.product_locations (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null unique references public.products(id) on delete cascade,
  shelf_id    uuid not null references public.shelves(id) on delete restrict,
  level       text not null check (level in ('bajo', 'medio', 'alto')),
  quantity    integer not null default 0,
  notes       text,
  assigned_by uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_locations_shelf on public.product_locations (shelf_id);

create trigger product_locations_updated_at
  before update on public.product_locations
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────
-- SCAN LOGS (Auditoria)
-- ─────────────────────────────────────────
create table if not exists public.scan_logs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete set null,
  scanned_value        text not null,
  resolved_product_id  uuid references public.products(id) on delete set null,
  action               text not null default 'lookup' check (action in ('lookup', 'assign')),
  created_at           timestamptz not null default now()
);

create index if not exists idx_scan_logs_created on public.scan_logs (created_at desc);

-- ─────────────────────────────────────────
-- USER PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists public.user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  role       text not null default 'staff' check (role in ('staff', 'admin')),
  name       text not null default '',
  created_at timestamptz not null default now()
);

-- Auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.shelves           enable row level security;
alter table public.products          enable row level security;
alter table public.product_locations enable row level security;
alter table public.scan_logs         enable row level security;
alter table public.user_profiles     enable row level security;

-- Shelves: anyone authenticated can read; only admin can write
create policy "shelves_select" on public.shelves
  for select to authenticated using (true);

create policy "shelves_insert" on public.shelves
  for insert to authenticated
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "shelves_update" on public.shelves
  for update to authenticated
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- Products: anyone authenticated can read; only admin can write
create policy "products_select" on public.products
  for select to authenticated using (true);

create policy "products_insert" on public.products
  for insert to authenticated
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "products_update" on public.products
  for update to authenticated
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "products_delete" on public.products
  for delete to authenticated
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- Product locations: anyone authenticated can read; only admin can write
create policy "locations_select" on public.product_locations
  for select to authenticated using (true);

create policy "locations_insert" on public.product_locations
  for insert to authenticated
  with check (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "locations_update" on public.product_locations
  for update to authenticated
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- Scan logs: authenticated can insert their own; admin can read all
create policy "scans_insert" on public.scan_logs
  for insert to authenticated with check (true);

create policy "scans_select_admin" on public.scan_logs
  for select to authenticated
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

-- User profiles: users can read their own; admin can read all
create policy "profiles_select_own" on public.user_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
  );

create policy "profiles_update_own" on public.user_profiles
  for update to authenticated
  using (id = auth.uid());

-- ─────────────────────────────────────────
-- SEED: Sample shelves
-- (Run separately after schema is applied)
-- ─────────────────────────────────────────
/*
insert into public.shelves (code, label, zone) values
  ('A1', 'Anaquel A1', 'Running'),
  ('A2', 'Anaquel A2', 'Running'),
  ('A3', 'Anaquel A3', 'Running'),
  ('B1', 'Anaquel B1', 'Futbol'),
  ('B2', 'Anaquel B2', 'Futbol'),
  ('C1', 'Anaquel C1', 'Casual'),
  ('C2', 'Anaquel C2', 'Casual'),
  ('D1', 'Anaquel D1', 'Accesorios'),
  ('D2', 'Anaquel D2', 'Accesorios')
on conflict (code) do nothing;
*/
