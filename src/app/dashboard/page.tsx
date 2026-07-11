import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { StockDashboard } from "@/components/StockDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id, business_name, verification_status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!supplier) {
    redirect("/onboarding");
  }

  const { data: listings } = await supabase
    .from("listing_status")
    .select("*")
    .eq("supplier_id", supplier.id)
    .eq("is_active", true);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {supplier.business_name}
            </h1>
            <p className="text-sm text-zinc-500">
              {supplier.verification_status === "verified"
                ? "Verified supplier"
                : "Verification pending — you can update stock while you wait"}
            </p>
          </div>
          <form action={signOut}>
            <button className="text-sm text-zinc-500 underline">Sign out</button>
          </form>
        </header>

        <Link
          href="/dashboard/add-listing"
          className="block w-full rounded-md border border-dashed border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          + Add a product to your listings
        </Link>

        <StockDashboard listings={listings ?? []} />
      </div>
    </div>
  );
}
