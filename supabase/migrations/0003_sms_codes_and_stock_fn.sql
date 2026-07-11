-- Phase 1: SMS stock-update support.
-- Short, stable codes suppliers text in ("STOCK REBAR12 50"), independent
-- of the internal sub_category slug so we can rename/reorganize categories
-- later without breaking a supplier's muscle memory for SMS commands.

alter table products add column if not exists sms_code text unique;

update products set sms_code = 'REBAR8'        where sub_category = 'rebar_8mm';
update products set sms_code = 'REBAR10'       where sub_category = 'rebar_10mm';
update products set sms_code = 'REBAR12'       where sub_category = 'rebar_12mm';
update products set sms_code = 'REBAR16'       where sub_category = 'rebar_16mm';
update products set sms_code = 'CEMENTOPC'     where sub_category = 'cement_opc';
update products set sms_code = 'CEMENTPPC'     where sub_category = 'cement_ppc';
update products set sms_code = 'CEMENTDANGOTE' where sub_category = 'cement_dangote';
update products set sms_code = 'CEMENTDERBA'   where sub_category = 'cement_derba';
update products set sms_code = 'CEMENTMUGHER'  where sub_category = 'cement_mugher';

-- ============================================================
-- upsert_stock_state: the single write path for stock updates,
-- called from both the web sync API (as the authenticated supplier,
-- RLS enforced via SECURITY INVOKER) and the SMS webhook (as the
-- admin/service-role client, which resolves + authorizes the supplier
-- by phone number before calling this).
--
-- Last-write-wins by client-supplied confidence_timestamp, so a queued
-- offline update that syncs late can never clobber a newer update that
-- already landed. This is the idempotency/ordering guard described in
-- the blueprint's offline-sync section.
-- ============================================================
create or replace function upsert_stock_state(
  p_listing_id uuid,
  p_quantity numeric,
  p_confidence_timestamp timestamptz,
  p_updated_by text
)
returns stock_state
language plpgsql
security invoker
as $$
declare
  result stock_state;
begin
  insert into stock_state (listing_id, quantity, confidence_timestamp, updated_by)
  values (p_listing_id, p_quantity, p_confidence_timestamp, p_updated_by)
  on conflict (listing_id) do update
    set quantity = excluded.quantity,
        confidence_timestamp = excluded.confidence_timestamp,
        updated_by = excluded.updated_by
    where stock_state.confidence_timestamp <= excluded.confidence_timestamp
  returning * into result;

  -- If the WHERE clause skipped the update (incoming write was stale),
  -- result is null from the RETURNING above — fetch the current row so
  -- callers always get a definite state back instead of an empty result.
  if result is null then
    select * into result from stock_state where listing_id = p_listing_id;
  end if;

  return result;
end;
$$;

-- Callers need execute rights; RLS on the underlying table still applies
-- because the function is SECURITY INVOKER.
grant execute on function upsert_stock_state(uuid, numeric, timestamptz, text) to authenticated, service_role;
