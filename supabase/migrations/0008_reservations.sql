-- Phase 5: reservation/inquiry flow.
-- Deliberately NOT a checkout — a structured lead, per the blueprint:
-- "Reserve 20 quintals, I'll pick up within 24 hrs" sent as a request
-- the supplier accepts/declines, same as a phone call today just with
-- better discovery upfront. No account required to submit one; no
-- automatic stock decrement on acceptance.

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  buyer_name text not null,
  buyer_phone text not null,
  quantity_requested numeric not null check (quantity_requested > 0),
  pickup_within_hours numeric not null default 24,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references auth.users (id)
);

create index if not exists reservations_listing_id_idx on reservations (listing_id);
create index if not exists reservations_status_idx on reservations (status);

alter table reservations enable row level security;

-- The one write path in the whole schema that doesn't require an
-- account, matching the blueprint's "buyer needs no account" MVP scope.
-- The WITH CHECK locks the row down to exactly what a fresh inquiry
-- should look like — pending, unresponded — regardless of what a
-- caller might try to send directly against the REST API with the
-- public anon key, since RLS (not the app UI) is what actually
-- enforces this.
create policy "Anyone can create a pending reservation on a public listing"
  on reservations for insert
  with check (
    status = 'pending'
    and responded_at is null
    and responded_by is null
    and exists (
      select 1 from listings l
      join suppliers s on s.id = l.supplier_id
      where l.id = reservations.listing_id
        and l.is_active
        and s.verification_status = 'verified'
    )
  );

-- Buyers can't browse each other's requests — only the owning supplier
-- can see/manage reservations against their own listings.
create policy "Suppliers view reservations on their own listings"
  on reservations for select
  using (
    exists (
      select 1 from listings l
      join suppliers s on s.id = l.supplier_id
      where l.id = reservations.listing_id
        and s.owner_id = auth.uid()
    )
  );

create policy "Suppliers update reservations on their own listings"
  on reservations for update
  using (
    exists (
      select 1 from listings l
      join suppliers s on s.id = l.supplier_id
      where l.id = reservations.listing_id
        and s.owner_id = auth.uid()
    )
  );

grant insert on reservations to anon, authenticated;
grant select, update on reservations to authenticated;
