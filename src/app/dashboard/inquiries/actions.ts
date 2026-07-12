"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondToReservation(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const reservationId = String(formData.get("reservation_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "accepted" && decision !== "declined") return;

  // RLS's "Suppliers update reservations on their own listings" policy
  // (migration 0008) is what actually authorizes this — it would
  // silently affect zero rows for a reservation that isn't tied to this
  // supplier's own listings.
  await supabase
    .from("reservations")
    .update({ status: decision, responded_at: new Date().toISOString(), responded_by: user.id })
    .eq("id", reservationId);

  revalidatePath("/dashboard/inquiries");
}
