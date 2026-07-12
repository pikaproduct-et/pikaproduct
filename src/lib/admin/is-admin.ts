import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/** Checks admin membership through RLS (the `is_admin()` Postgres
 * function / `admins` table self-check policy in migration 0006) rather
 * than trusting anything client-supplied. Call with the caller's own
 * authenticated server client, never the admin/service-role client. */
export async function isAdmin(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return Boolean(data);
}
