-- Phase 3: verification workflow.
-- Manual, human-in-the-loop verification per the blueprint — no
-- self-service path to becoming a supplier that buyers can see.

-- ============================================================
-- admins: minimal allowlist for who can access verification tooling.
-- No signup path on purpose — the first admin is inserted by hand via
-- the Supabase SQL editor (see README), matching the same
-- human-in-the-loop principle the verification workflow itself uses.
-- The RLS policy only ever lets a user check their OWN membership, not
-- browse the list — that's all the app needs.
-- ============================================================
create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "Users can check their own admin membership"
  on admins for select
  using (auth.uid() = user_id);

-- security invoker (the default) is correct here: this function's query
-- is exactly the self-check policy above, so it never needs to see rows
-- the calling user couldn't already see directly.
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_admin() to authenticated;

-- ============================================================
-- Admin access to suppliers, enforced by RLS (not a service-role
-- bypass) — same "RLS is what actually authorizes this, not
-- application code" posture as the rest of the schema.
-- ============================================================
create policy "Admins can view all suppliers"
  on suppliers for select
  using (is_admin());

create policy "Admins can update all suppliers"
  on suppliers for update
  using (is_admin());
