"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/is-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(supabase))) {
    // Re-checked here even though the layout already gates the page —
    // server actions are directly callable and must not trust the UI.
    throw new Error("Not authorized");
  }

  return { supabase, userId: user.id };
}

export async function verifySupplier(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const supplierId = String(formData.get("supplier_id") ?? "");

  // The actual authorization is RLS's "Admins can update all suppliers"
  // policy (migration 0006) — this update would fail silently for a
  // non-admin even if the requireAdmin() check above were somehow
  // bypassed.
  await supabase
    .from("suppliers")
    .update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: userId,
    })
    .eq("id", supplierId);

  revalidatePath("/admin/suppliers");
}

export async function rejectSupplier(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const supplierId = String(formData.get("supplier_id") ?? "");

  await supabase
    .from("suppliers")
    .update({
      verification_status: "rejected",
      verified_at: new Date().toISOString(),
      verified_by: userId,
    })
    .eq("id", supplierId);

  revalidatePath("/admin/suppliers");
}

export async function resetToPending(formData: FormData) {
  const { supabase } = await requireAdmin();
  const supplierId = String(formData.get("supplier_id") ?? "");

  await supabase
    .from("suppliers")
    .update({ verification_status: "pending", verified_at: null, verified_by: null })
    .eq("id", supplierId);

  revalidatePath("/admin/suppliers");
}
