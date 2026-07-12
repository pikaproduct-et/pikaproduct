"use server";

import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms/notify";

export interface SubmitReservationInput {
  listingId: string;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  pickupWithinHours: number;
  note?: string;
}

export type SubmitReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; error: string };

export async function submitReservation(
  input: SubmitReservationInput
): Promise<SubmitReservationResult> {
  const supabase = await createClient();

  // No auth check on purpose — this is the one write path in the app
  // that doesn't require an account (see blueprint's buyer MVP scope).
  // RLS's "Anyone can create a pending reservation on a public listing"
  // policy (migration 0008) is what actually authorizes this, not the
  // fact that we only expose this action from the search UI.
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      listing_id: input.listingId,
      buyer_name: input.buyerName,
      buyer_phone: input.buyerPhone,
      quantity_requested: input.quantity,
      pickup_within_hours: input.pickupWithinHours,
      note: input.note || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not submit request" };
  }

  // Best-effort notification — a failed SMS shouldn't fail the
  // reservation itself; the supplier still sees it in their dashboard
  // inbox either way.
  await notifySupplier(supabase, input).catch(() => {});

  return { ok: true, reservationId: data.id };
}

async function notifySupplier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SubmitReservationInput
) {
  const { data: listing } = await supabase
    .from("listings")
    .select("product:products(name), supplier:suppliers(phone)")
    .eq("id", input.listingId)
    .single();

  const product = Array.isArray(listing?.product) ? listing.product[0] : listing?.product;
  const supplier = Array.isArray(listing?.supplier) ? listing.supplier[0] : listing?.supplier;

  if (!supplier?.phone) return;

  await sendSms(
    supplier.phone,
    `New PikaProduct inquiry: ${input.buyerName} (${input.buyerPhone}) wants ${input.quantity} ${
      product?.name ?? "units"
    }, pickup within ${input.pickupWithinHours}h. Check your dashboard to respond.`
  );
}
