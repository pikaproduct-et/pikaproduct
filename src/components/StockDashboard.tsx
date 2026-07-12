"use client";

import { useEffect, useState } from "react";
import { queueUpdate, registerAutoFlush, type FlushResult } from "@/lib/offline/outbox";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import type { FreshnessStatus } from "@/lib/freshness/format";
import type { Database } from "@/lib/types/database";
import { bilingualName } from "@/lib/products/displayName";

export type ListingStatusRow = Database["public"]["Views"]["listing_status"]["Row"];

function ListingRow({ listing }: { listing: ListingStatusRow }) {
  const [quantity, setQuantity] = useState(listing.quantity ?? 0);
  const [confidenceTimestamp, setConfidenceTimestamp] = useState(listing.confidence_timestamp);
  const [status, setStatus] = useState<FreshnessStatus>(listing.freshness_status);
  const [saving, setSaving] = useState(false);
  const [queued, setQueued] = useState(false);

  async function save(next: number) {
    setQuantity(next);
    setSaving(true);
    setQueued(false);

    await queueUpdate({ listingId: listing.listing_id, quantity: next });

    // Optimistic local update — the point of offline-first is that the
    // supplier never watches a spinner. Freshness resets to "fresh"
    // immediately since we just confirmed the count ourselves; the
    // server will agree once the sync lands.
    setConfidenceTimestamp(new Date().toISOString());
    setStatus("fresh");
    setSaving(false);
    setQueued(true);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {bilingualName(listing.product_name, listing.product_name_am)}
          </p>
          <p className="text-xs text-zinc-500">
            {listing.price_per_unit} {listing.currency} / {listing.product_unit}
            {listing.product_sms_code && (
              <>
                {" "}
                · SMS code <span className="font-mono">{listing.product_sms_code}</span>
              </>
            )}
          </p>
        </div>
        <FreshnessBadge status={status} confidenceTimestamp={confidenceTimestamp} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => save(Math.max(0, quantity - 1))}
          className="h-12 w-12 rounded-md border border-zinc-300 text-xl font-semibold dark:border-zinc-700"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          onBlur={(e) => save(Number(e.target.value))}
          className="h-12 w-full rounded-md border border-zinc-300 px-3 text-center text-lg dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => save(quantity + 1)}
          className="h-12 w-12 rounded-md border border-zinc-300 text-xl font-semibold dark:border-zinc-700"
        >
          +
        </button>
      </div>

      {(saving || queued) && (
        <p className="mt-2 text-xs text-zinc-400">
          {saving ? "Saving…" : "Saved on this device — syncing when online"}
        </p>
      )}
    </div>
  );
}

export function StockDashboard({ listings }: { listings: ListingStatusRow[] }) {
  const [syncStatus, setSyncStatus] = useState<FlushResult | null>(null);

  useEffect(() => {
    registerAutoFlush((result) => setSyncStatus(result));
  }, []);

  if (listings.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        No listings yet — add a product above to start updating stock.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {syncStatus && syncStatus.remaining > 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {syncStatus.remaining} update{syncStatus.remaining === 1 ? "" : "s"} waiting to sync —
          will retry automatically once you&apos;re back online.
        </p>
      )}
      {listings.map((listing) => (
        <ListingRow key={listing.listing_id} listing={listing} />
      ))}
    </div>
  );
}
