-- Phase 2: freshness/decay logic.
-- Staleness is computed at READ time from confidence_timestamp, never
-- stored as a static flag (see blueprint Section 2) — different
-- categories decay at different rates, so a single global "is this
-- stale" boolean would misrepresent at least one category.

alter table products add column if not exists freshness_window_hours numeric not null default 72;

-- Category-specific windows: fast-moving categories (rebar) decay sooner
-- than slower-turnover ones (cement), per the blueprint's example numbers.
update products set freshness_window_hours = 48  where category = 'rebar';
update products set freshness_window_hours = 120 where category = 'cement';

-- ============================================================
-- listing_status: the canonical read model for "is this listing's
-- stock number still trustworthy". Used by the supplier dashboard now
-- and will be reused by buyer search/compare in Phase 4 — one place
-- computes freshness so the two surfaces can never disagree.
--
-- security_invoker means this view enforces RLS as the querying user,
-- not the view owner — required so it doesn't leak unverified/inactive
-- suppliers' data to the public. See migration 0001 for the underlying
-- RLS policies this relies on.
-- ============================================================
create or replace view listing_status
with (security_invoker = true) as
select
  l.id as listing_id,
  l.supplier_id,
  l.product_id,
  l.price_per_unit,
  l.currency,
  l.is_active,
  p.name as product_name,
  p.unit as product_unit,
  p.category as product_category,
  p.sms_code as product_sms_code,
  p.freshness_window_hours,
  ss.quantity,
  ss.confidence_timestamp,
  ss.updated_by,
  case
    when ss.confidence_timestamp is null then 'unconfirmed'
    when extract(epoch from (now() - ss.confidence_timestamp)) <= p.freshness_window_hours * 3600 then 'fresh'
    when extract(epoch from (now() - ss.confidence_timestamp)) <= p.freshness_window_hours * 2 * 3600 then 'aging'
    else 'stale'
  end as freshness_status
from listings l
join products p on p.id = l.product_id
left join stock_state ss on ss.listing_id = l.id;

grant select on listing_status to authenticated, anon;
