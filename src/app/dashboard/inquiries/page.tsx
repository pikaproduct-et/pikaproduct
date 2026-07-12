import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { respondToReservation } from "./actions";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status ?? "pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS ("Suppliers view reservations on their own listings") does the
  // actual filtering to this supplier's data — no explicit owner check
  // needed in the query itself.
  const query = supabase
    .from("reservations")
    .select(
      "id, buyer_name, buyer_phone, quantity_requested, pickup_within_hours, note, status, created_at, listing:listings(product:products(name, unit))"
    )
    .order("created_at", { ascending: false });

  const { data: reservations } =
    filter === "all"
      ? await query
      : await query.eq("status", filter as "pending" | "accepted" | "declined");

  const tabs = [
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Declined", value: "declined" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Inquiries</h1>
          <p className="text-sm text-zinc-500">
            Buyer requests for your listings — not a checkout, just a lead worth a call.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <a
              key={tab.value}
              href={`/dashboard/inquiries?status=${tab.value}`}
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

        {!reservations || reservations.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            No {filter === "all" ? "" : filter} inquiries.
          </p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => {
              const listing = Array.isArray(r.listing) ? r.listing[0] : r.listing;
              const product = Array.isArray(listing?.product) ? listing.product[0] : listing?.product;

              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {r.quantity_requested} {product?.unit ?? ""} of {product?.name ?? "a listing"}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {r.buyer_name} · {r.buyer_phone}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Pickup within {r.pickup_within_hours}h · requested {formatDateTime(r.created_at)}
                      </p>
                      {r.note && <p className="mt-1 text-sm text-zinc-500">&ldquo;{r.note}&rdquo;</p>}
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <a
                      href={`tel:${r.buyer_phone}`}
                      className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Call buyer
                    </a>
                    {r.status === "pending" && (
                      <>
                        <form action={respondToReservation}>
                          <input type="hidden" name="reservation_id" value={r.id} />
                          <input type="hidden" name="decision" value="accepted" />
                          <button
                            type="submit"
                            className="rounded-md border border-green-600 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                          >
                            Accept
                          </button>
                        </form>
                        <form action={respondToReservation}>
                          <input type="hidden" name="reservation_id" value={r.id} />
                          <input type="hidden" name="decision" value="declined" />
                          <button
                            type="submit"
                            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            Decline
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
