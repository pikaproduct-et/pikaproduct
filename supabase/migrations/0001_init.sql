-- PikaProduct: Phase 0 schema
-- Core split: catalog (near-static) vs. stock_state (hot, high-write).
-- See docs/PikaProduct_Blueprint.md, Section 2, for the reasoning behind this split.

create extension if not exists postgis;
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ============================================================
-- suppliers
-- ============================================================
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  business_name text not null,
  phone text not null,
  woreda text,
  sub_city text,
  city text default 'Addis Ababa',
  location geography(point, 4326), -- lng/lat, used for proximity search
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_location_idx on suppliers using gist (location);
create index if not exists suppliers_verification_status_idx on suppliers (verification_status);

-- ============================================================
-- products (curated catalog, not free-text — see blueprint Section 1:
-- "don't let suppliers free-type product names")
-- ============================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- e.g. 'rebar', 'cement', 'pipe', 'electrical'
  sub_category text,             -- e.g. 'rebar_12mm', 'cement_opc'
  name text not null,            -- canonical display name
  unit text not null,            -- 'quintal', 'bag', 'meter', 'piece'
  attributes jsonb not null default '{}'::jsonb, -- { "diameter_mm": 12, "brand": "Dangote" }
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category);

-- ============================================================
-- listings (a supplier's offer of a product — price lives here,
-- quantity/freshness lives in stock_state)
-- ============================================================
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  price_per_unit numeric(12, 2) not null check (price_per_unit >= 0),
  currency text not null default 'ETB',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, product_id)
);

create index if not exists listings_product_id_idx on listings (product_id);
create index if not exists listings_supplier_id_idx on listings (supplier_id);

-- ============================================================
-- stock_state (the hot table — current quantity + freshness per listing)
-- One row per listing = current state. Kept narrow deliberately: no joins
-- to supplier profile data, so frequent small writes here don't contend
-- with buyer-side search reads on the heavier tables.
-- ============================================================
create table if not exists stock_state (
  listing_id uuid primary key references listings (id) on delete cascade,
  quantity numeric(12, 2) not null default 0 check (quantity >= 0),
  confidence_timestamp timestamptz not null default now(),
  updated_by text not null default 'app'
    check (updated_by in ('app', 'sms', 'ussd', 'admin')),
  updated_at timestamptz not null default now()
);

-- Freshness is computed at read time (category-specific decay windows differ —
-- see blueprint Section 2), not stored as a static boolean. Application code
-- compares confidence_timestamp against a per-category decay window.

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger suppliers_set_updated_at
  before update on suppliers
  for each row execute function set_updated_at();

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

create trigger stock_state_set_updated_at
  before update on stock_state
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security — locked down by default.
-- Phase 0 policies: public read of verified suppliers/active listings/stock,
-- writes restricted to the owning supplier. Tighten/expand in Phase 1 as
-- the supplier auth flow is built.
-- ============================================================
alter table suppliers enable row level security;
alter table products enable row level security;
alter table listings enable row level security;
alter table stock_state enable row level security;

create policy "Public can read verified suppliers"
  on suppliers for select
  using (verification_status = 'verified');

create policy "Suppliers can read their own row regardless of status"
  on suppliers for select
  using (auth.uid() = owner_id);

create policy "Suppliers can update their own row"
  on suppliers for update
  using (auth.uid() = owner_id);

create policy "Authenticated users can insert their own supplier row"
  on suppliers for insert
  with check (auth.uid() = owner_id);

create policy "Public can read products"
  on products for select
  using (true);

create policy "Public can read active listings from verified suppliers"
  on listings for select
  using (
    is_active
    and exists (
      select 1 from suppliers
      where suppliers.id = listings.supplier_id
        and suppliers.verification_status = 'verified'
    )
  );

create policy "Suppliers manage their own listings"
  on listings for all
  using (
    exists (
      select 1 from suppliers
      where suppliers.id = listings.supplier_id
        and suppliers.owner_id = auth.uid()
    )
  );

create policy "Public can read stock state for public listings"
  on stock_state for select
  using (
    exists (
      select 1 from listings
      where listings.id = stock_state.listing_id
        and listings.is_active
    )
  );

create policy "Suppliers manage stock state for their own listings"
  on stock_state for all
  using (
    exists (
      select 1 from listings
      join suppliers on suppliers.id = listings.supplier_id
      where listings.id = stock_state.listing_id
        and suppliers.owner_id = auth.uid()
    )
  );
