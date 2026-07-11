import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addListing } from "./actions";

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
          <form action={addListing} className="space-y-4">
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Product
              </label>
              <select
                id="product_id"
                name="product_id"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              >
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="price_per_unit" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Price per unit (ETB)
              </label>
              <input
                id="price_per_unit"
                name="price_per_unit"
                type="number"
                step="0.01"
                min="0"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Current quantity in stock
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
            >
              Add to my listings
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
