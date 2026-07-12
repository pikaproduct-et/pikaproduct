"use client";

import { useState } from "react";
import { submitReservation } from "@/app/search/actions";

/** Collapsed "Reserve" link that expands into the structured inquiry
 * form — deliberately lightweight (name, phone, quantity, pickup
 * window, optional note), not a checkout. Per the blueprint: this opens
 * a real conversation the supplier accepts/declines, same as a phone
 * call today, just with better discovery upfront. */
export function ReserveForm({
  listingId,
  productName,
  unit,
  availableQuantity,
  businessName,
}: {
  listingId: string;
  productName: string;
  unit: string;
  availableQuantity: number | null;
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const res = await submitReservation({
      listingId,
      buyerName: String(formData.get("buyer_name") ?? ""),
      buyerPhone: String(formData.get("buyer_phone") ?? ""),
      quantity: Number(formData.get("quantity") ?? 0),
      pickupWithinHours: Number(formData.get("pickup_within_hours") ?? 24),
      note: String(formData.get("note") ?? ""),
    });
    setSubmitting(false);

    if (res.ok) {
      setResult({ ok: true, message: `Request sent — ${businessName} will contact you.` });
    } else {
      setResult({ ok: false, message: res.error });
    }
  }

  if (result) {
    return (
      <p
        className={`text-sm ${result.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
      >
        {result.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Reserve {productName.toLowerCase()}
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="grid grid-cols-2 gap-2">
        <input
          name="buyer_name"
          required
          placeholder="Your name"
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          name="buyer_phone"
          type="tel"
          required
          placeholder="Your phone"
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder={`Qty (${unit})`}
            className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {availableQuantity !== null && (
            <p className="mt-0.5 text-xs text-zinc-400">{availableQuantity} {unit} listed</p>
          )}
        </div>
        <select
          name="pickup_within_hours"
          defaultValue="24"
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="4">Pickup in 4h</option>
          <option value="24">Pickup in 24h</option>
          <option value="72">Pickup in 3 days</option>
        </select>
      </div>
      <input
        name="note"
        placeholder="Note (optional)"
        className="w-full rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {submitting ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
