import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyStockUpdate } from "@/lib/stock/update-stock";

/**
 * Sync target for the offline outbox (src/lib/offline/outbox.ts). Runs as
 * the signed-in supplier — RLS on stock_state ("Suppliers manage stock
 * state for their own listings") is what actually prevents a supplier
 * from updating someone else's listing, not application code here.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.listingId !== "string" || typeof body.quantity !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await applyStockUpdate(supabase, {
      listingId: body.listingId,
      quantity: body.quantity,
      confidenceTimestamp: body.confidenceTimestamp ?? new Date().toISOString(),
      source: "app",
    });
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // RLS violations and bad listing IDs land here as Postgres errors —
    // treat as a client error, not a queue-and-retry case.
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
