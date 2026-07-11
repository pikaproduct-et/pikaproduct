"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!supplier) {
    redirect("/onboarding");
  }

  const productId = String(formData.get("product_id") ?? "");
  const price = Number(formData.get("price_per_unit") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 0);

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({ supplier_id: supplier.id, product_id: productId, price_per_unit: price })
    .select("id")
    .single();

  if (listingError || !listing) {
    redirect(
      `/dashboard/add-listing?error=${encodeURIComponent(listingError?.message ?? "Could not create listing")}`
    );
  }

  const { error: stockError } = await supabase.from("stock_state").insert({
    listing_id: listing.id,
    quantity,
    confidence_timestamp: new Date().toISOString(),
    updated_by: "app",
  });

  if (stockError) {
    redirect(`/dashboard/add-listing?error=${encodeURIComponent(stockError.message)}`);
  }

  redirect("/dashboard");
}
