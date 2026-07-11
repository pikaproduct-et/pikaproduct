import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StockUpdateSource } from "@/lib/types/database";

export interface StockUpdateInput {
  listingId: string;
  quantity: number;
  /** Client-generated timestamp of when the update was made (not when it
   * synced) — this is what makes offline queued updates order correctly. */
  confidenceTimestamp: string;
  source: StockUpdateSource;
}

/**
 * The single write path for stock quantity, used by both the web app's
 * sync endpoint (authenticated supplier, RLS-enforced) and the SMS
 * webhook (admin client, pre-authorized by phone lookup). Delegates the
 * actual upsert + last-write-wins ordering to the `upsert_stock_state`
 * Postgres function — see supabase/migrations/0003_sms_codes_and_stock_fn.sql.
 */
export async function applyStockUpdate(
  supabase: SupabaseClient<Database>,
  input: StockUpdateInput
) {
  const { data, error } = await supabase.rpc("upsert_stock_state", {
    p_listing_id: input.listingId,
    p_quantity: input.quantity,
    p_confidence_timestamp: input.confidenceTimestamp,
    p_updated_by: input.source,
  });

  if (error) {
    throw new Error(`Stock update failed: ${error.message}`);
  }

  return data;
}
