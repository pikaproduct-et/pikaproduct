import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddListingForm } from "@/components/AddListingForm";

export default async function AddListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
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

  const { data: existingListings } = await supabase
    .from("listings")
    .select("product_id")
    .eq("supplier_id", supplier.id);

  const listedProductIds = new Set((existingListings ?? []).map((l) => l.product_id));

  const { data: products } = await supabase
    .from("products")
    .select("id, category, name, unit")
    .order("category")
    .order("name");

  const available = (products ?? []).filter((p) => !listedProductIds.has(p.id));

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Add a product</h1>

        {params.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {params.error}
          </div>
        )}

        {available.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You&apos;ve already listed every product in the catalog. More categories are added
            as the platform grows.
          </p>
        ) : (
          <AddListingForm products={available} />
        )}
      </div>
    </div>
  );
}
