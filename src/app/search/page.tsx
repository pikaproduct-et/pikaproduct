import { createClient } from "@/lib/supabase/server";
import { BuyerSearch } from "@/components/BuyerSearch";

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, unit")
    .order("category")
    .order("name");

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Find materials near you
          </h1>
          <p className="text-sm text-zinc-500">
            Only verified suppliers with active listings show up here.
          </p>
        </div>
        <BuyerSearch products={products ?? []} />
      </div>
    </div>
  );
}
