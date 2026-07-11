"use client";

import { useEffect, useState } from "react";
import { queueUpdate, registerAutoFlush, type FlushResult } from "@/lib/offline/outbox";

interface Product {
  name: string;
  unit: string;
  sms_code: string | null;
}

interface StockRow {
  quantity: number;
  confidence_timestamp: string;
  updated_by: string;
}

export interface ListingWithStock {
  id: string;
  price_per_unit: number;
  currency: string;
  product: Product | Product[] | null;
  stock_state: StockRow | StockRow[] | null;
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatTimestamp(iso: string | undefined) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListingRow({ listing }: { listing: ListingWithStock }) {
  const product = one(listing.product);
  const stock = one(listing.stock_state);

  const [quantity, setQuantity] = useState(stock?.quantity ?? 0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | undefined>(stock?.confidence_timestamp);
  const [queued, setQueued] = useState(false);

  async function save(next: number) {
    setQuantity(next);
    setSaving(true);
    setQueued(false);

    await queueUpdate({ listingId: listing.id, quantity: next });

    // queueUpdate writes locally first, then registerAutoFlush's listener
    // (or the immediate attempt below) pushes it out. We optimistically
    // mark it as saved locally right away — the point of offline-first is
    // that the supplier never has to watch a spinner.
    setSavedAt(new Date().toISOString());
    setSaving(false);
    setQueued(true);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {product?.name ?? "Unknown product"}
          </p>
          <p className="text-xs text-zinc-500">
            {listing.price_per_unit} {listing.currency} / {product?.unit ?? "unit"}
            {product?.sms_code && (
              <>
                {" "}
                · SMS code <span className="font-mono">{product.sms_code}</span>
              </>
            )}
          </p>
        </div>
        <span className="whitespace-nowrap text-xs text-zinc-400">
          confirmed {formatTimestamp(savedAt)}
        </span>
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

export function StockDashboard({ listings }: { listings: ListingWithStock[] }) {
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
        <ListingRow key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
