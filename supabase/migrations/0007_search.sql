-- Phase 4: buyer search & compare.
-- One function backs both "browse nearby" (category only) and the
-- "compare this exact product across suppliers" view (product_id set) —
-- the blueprint's "aha moment" is the same SKU side by side with
-- price + distance + confidence, so this returns everything a compare
-- table needs in one call rather than making the client stitch it
-- together from listing_status + suppliers separately.
--
-- security invoker + explicit verification/active filters: RLS on the
-- underlying tables already restricts anon/authenticated callers to
-- verified+active listings, but a signed-in admin or supplier calling
-- this (e.g. testing) has broader RLS visibility via the Phase 3
-- policies — the explicit filters keep search results public-safe
-- regardless of who's asking.
create or replace function search_listings(
  p_lat double precision default null,
  p_lng double precision default null,
  p_category text default null,
  p_product_id uuid default null,
  p_radius_km double precision default 25
)
returns table (
  listing_id uuid,
  supplier_id uuid,
  business_name text,
  phone text,
  sub_city text,
  woreda text,
  distance_km double precision,
  product_id uuid,
  product_name text,
  product_unit text,
  product_category text,
  price_per_unit numeric,
  currency text,
  quantity numeric,
  confidence_timestamp timestamptz,
  freshness_status text
)
language sql
stable
security invoker
as $$
  select
    ls.listing_id,
    ls.supplier_id,
    s.business_name,
    s.phone,
    s.sub_city,
    s.woreda,
    case
      when p_lat is not null and p_lng is not null and s.location is not null then
        ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000.0
      else null
    end as distance_km,
    ls.product_id,
    ls.product_name,
    ls.product_unit,
    ls.product_category,
    ls.price_per_unit,
    ls.currency,
    ls.quantity,
    ls.confidence_timestamp,
    ls.freshness_status
  from listing_status ls
  join suppliers s on s.id = ls.supplier_id
  where ls.is_active
    and s.verification_status = 'verified'
    and (p_category is null or ls.product_category = p_category)
    and (p_product_id is null or ls.product_id = p_product_id)
    and (
      p_lat is null or p_lng is null or s.location is null
      or ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
    )
  order by
    (case
      when p_lat is not null and p_lng is not null and s.location is not null then
        ST_Distance(s.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null
    end) asc nulls last,
    ls.product_name asc;
$$;

grant execute on function search_listings(double precision, double precision, text, uuid, double precision)
  to anon, authenticated;
