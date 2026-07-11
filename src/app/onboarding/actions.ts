"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSupplierProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const lat = formData.get("lat");
  const lng = formData.get("lng");

  const { error } = await supabase.rpc("upsert_own_supplier", {
    p_business_name: String(formData.get("business_name") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
    p_city: String(formData.get("city") ?? "Addis Ababa"),
    p_sub_city: String(formData.get("sub_city") ?? "") || null,
    p_woreda: String(formData.get("woreda") ?? "") || null,
    p_lat: lat ? Number(lat) : null,
    p_lng: lng ? Number(lng) : null,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
