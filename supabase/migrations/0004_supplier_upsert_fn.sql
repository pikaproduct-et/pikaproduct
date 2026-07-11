-- Phase 1: supplier onboarding.
-- PostGIS geography columns aren't reliably settable through a plain
-- PostgREST insert payload, so onboarding goes through this function,
-- which builds the point server-side from lat/lng. security invoker so
-- RLS (owner_id = auth.uid()) still governs who can write what.

create or replace function upsert_own_supplier(
  p_business_name text,
  p_phone text,
  p_city text,
  p_sub_city text,
  p_woreda text,
  p_lat double precision,
  p_lng double precision
)
returns suppliers
language plpgsql
security invoker
as $$
declare
  result suppliers;
  point geography(point, 4326);
begin
  if p_lat is not null and p_lng is not null then
    point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
  end if;

  insert into suppliers (owner_id, business_name, phone, city, sub_city, woreda, location)
  values (auth.uid(), p_business_name, p_phone, p_city, p_sub_city, p_woreda, point)
  on conflict (owner_id) do update
    set business_name = excluded.business_name,
        phone = excluded.phone,
        city = excluded.city,
        sub_city = excluded.sub_city,
        woreda = excluded.woreda,
        location = coalesce(excluded.location, suppliers.location)
  returning * into result;

  return result;
end;
$$;

grant execute on function upsert_own_supplier(text, text, text, text, text, double precision, double precision) to authenticated;

-- one supplier profile per auth user for now (a supplier managing
-- multiple branches under one login is Phase 2+ per the blueprint)
alter table suppliers add constraint suppliers_owner_id_unique unique (owner_id);
