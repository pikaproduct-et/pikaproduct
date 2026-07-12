import { createClient } from "@/lib/supabase/server";
import { verifySupplier, rejectSupplier, resetToPending } from "./actions";
import type { VerificationStatus } from "@/lib/types/database";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLE: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  verified: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.status as VerificationStatus | undefined) ?? "pending";

  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, business_name, phone, city, sub_city, woreda, verification_status, created_at")
    .eq("verification_status", filter)
    .order("created_at", { ascending: true });

  const tabs: { label: string; value: VerificationStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "Verified", value: "verified" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Suppliers</h1>
        <p className="text-sm text-zinc-500">
          Verify a business by phone or a site visit before they go live — see the blueprint&apos;s
          verification guidance for what to check.
        </p>
      </div>

      <nav className="flex gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/suppliers?status=${tab.value}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === tab.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-600 border border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {!suppliers || suppliers.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No {filter} suppliers.
        </p>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {supplier.business_name}
                  </p>
                  <p className="text-sm text-zinc-500">{supplier.phone}</p>
                  <p className="text-xs text-zinc-400">
                    {[supplier.sub_city, supplier.woreda, supplier.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Applied {formatDate(supplier.created_at)}
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[supplier.verification_status]}`}
                >
                  {supplier.verification_status}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {supplier.verification_status !== "verified" && (
                  <form action={verifySupplier}>
                    <input type="hidden" name="supplier_id" value={supplier.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Verify
                    </button>
                  </form>
                )}
                {supplier.verification_status !== "rejected" && (
                  <form action={rejectSupplier}>
                    <input type="hidden" name="supplier_id" value={supplier.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Reject
                    </button>
                  </form>
                )}
                {supplier.verification_status !== "pending" && (
                  <form action={resetToPending}>
                    <input type="hidden" name="supplier_id" value={supplier.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      Reset to pending
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
