"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { ContactButtons } from "@/components/ContactButtons";
import { ReserveForm } from "@/components/ReserveForm";
import { loadSearchCache, saveSearchCache } from "@/lib/offline/searchCache";
import { relativeTime, type FreshnessStatus } from "@/lib/freshness/format";
import { bilingualName, formatCategoryLabel, matchesProductQuery } from "@/lib/products/displayName";

interface ProductOption {
  id: string;
  name: string;
  name_am: string;
  category: string;
  unit: string;
}

interface SearchResult {
  listing_id: string;
  supplier_id: string;
  business_name: string;
  phone: string;
  sub_city: string | null;
  woreda: string | null;
  distance_km: number | null;
  product_id: string;
  product_name: string;
  product_name_am: string;
  product_unit: string;
  product_category: string;
  price_per_unit: number;
  currency: string;
  quantity: number | null;
  confidence_timestamp: string | null;
  freshness_status: FreshnessStatus;
}

function formatDistance(km: number | null) {
  if (km === null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function BuyerSearch({ products }: { products: ProductOption[] }) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const [category, setCategory] = useState(categories[0] ?? "");
  const [productId, setProductId] = useState<string>("");
  const [productQuery, setProductQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [resultsSavedAt, setResultsSavedAt] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearchedThisSession, setHasSearchedThisSession] = useState(false);

  const productsInCategory = products.filter((p) => p.category === category);

  // With 152 SKUs across 9 categories, guessing the right category
  // first is slower than just typing what you're after. A non-empty
  // search box searches every product regardless of category (English
  // or Amharic name); an empty box falls back to the category-scoped
  // list, same as before.
  const trimmedQuery = productQuery.trim();
  const searchMatches = trimmedQuery
    ? products.filter((p) => matchesProductQuery(p.name, p.name_am, trimmedQuery))
    : null;
  const productOptions = searchMatches ?? productsInCategory;

  // Show the last successful search immediately on load — "last-fetched
  // results cached and viewable ... if the buyer loses signal
  // mid-session" (blueprint Section 1). This is what's on screen until
  // the buyer runs a fresh search of their own.
  // Reading localStorage (an external system) on mount and syncing it
  // into state is exactly the documented use case for an effect — this
  // can't be a lazy useState initializer instead, since this is a
  // client component that's server-rendered first, and a lazy
  // initializer wouldn't re-run on client hydration to pick up
  // browser-only storage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const cached = loadSearchCache<SearchResult>();
    if (cached) {
      setResults(cached.results);
      setResultsSavedAt(cached.savedAt);
      setIsCached(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationDenied(true);
        setLocating(false);
      },
      // Data saver skips GPS in favor of cheaper (faster, less battery,
      // less data) network/cell-tower positioning — plenty accurate for
      // "which supplier is nearby," not turn-by-turn navigation.
      { enableHighAccuracy: !dataSaver, timeout: 10000 }
    );
  }

  async function search() {
    setSearching(true);
    setHasSearchedThisSession(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("search_listings", {
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
        p_category: category || null,
        p_product_id: productId || null,
        p_radius_km: 25,
        p_limit: dataSaver ? 8 : 15,
      });

      if (error) throw error;

      const fresh = (data as SearchResult[]) ?? [];
      setResults(fresh);
      setResultsSavedAt(new Date().toISOString());
      setIsCached(false);
      saveSearchCache(fresh);
    } catch {
      // Offline or request failed — fall back to whatever we last cached
      // rather than showing a blank error. If there's nothing cached
      // either, results stays whatever it was (likely null -> empty state).
      const cached = loadSearchCache<SearchResult>();
      if (cached) {
        setResults(cached.results);
        setResultsSavedAt(cached.savedAt);
        setIsCached(true);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label htmlFor="product-search" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Search products
          </label>
          <input
            id="product-search"
            type="text"
            value={productQuery}
            onChange={(e) => {
              setProductQuery(e.target.value);
              setProductId("");
            }}
            placeholder="Type a product name — English or Amharic…"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
          {trimmedQuery && searchMatches?.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No products match &quot;{trimmedQuery}&quot;.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Category
          </label>
          <select
            id="category"
            value={category}
            disabled={!!trimmedQuery}
            onChange={(e) => {
              setCategory(e.target.value);
              setProductId("");
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {formatCategoryLabel(c)}
              </option>
            ))}
          </select>
          {trimmedQuery && (
            <p className="mt-1 text-xs text-zinc-400">Clear the search box to browse by category instead.</p>
          )}
        </div>

        <div>
          <label htmlFor="product" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {trimmedQuery
              ? "Matching products"
              : "Product (optional — leave as \"All\" to compare the whole category)"}
          </label>
          <select
            id="product"
            value={productId}
            onChange={(e) => {
              const id = e.target.value;
              setProductId(id);
              // Search spans every category, so picking a match needs
              // to sync the category filter behind it — otherwise a
              // later "Search" click (or clearing the query) would use
              // whatever category happened to be selected before.
              if (searchMatches) {
                const picked = products.find((p) => p.id === id);
                if (picked) setCategory(picked.category);
              }
            }}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled={!!trimmedQuery}>
              {trimmedQuery ? "Select a product…" : `All ${formatCategoryLabel(category)} products`}
            </option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {bilingualName(p.name, p.name_am)} ({p.unit})
                {trimmedQuery ? ` — ${formatCategoryLabel(p.category)}` : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          className="w-full rounded-md border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {coords ? "Location set ✓" : locating ? "Locating…" : "Use my current location"}
        </button>
        {locationDenied && (
          <p className="text-xs text-amber-600">
            Couldn&apos;t get your location — results will show without distance.
          </p>
        )}

        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={dataSaver}
            onChange={(e) => setDataSaver(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Data saver (fewer results, lower-accuracy location)
        </label>

        <button
          type="button"
          onClick={search}
          disabled={searching || (!!trimmedQuery && !productId)}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {searching ? "Searching…" : hasSearchedThisSession ? "Search again" : "Search"}
        </button>
      </div>

      {results !== null && (
        <div className="space-y-3">
          {isCached && resultsSavedAt && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <span>
                {hasSearchedThisSession ? "You're offline — showing" : "Showing"} results from{" "}
                {relativeTime(resultsSavedAt)}.
              </span>
              <button type="button" onClick={search} className="whitespace-nowrap underline">
                Refresh
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No verified suppliers found{coords ? " within 25 km" : ""}. Try a different
              category or product.
            </p>
          ) : (
            results.map((r) => (
              <div
                key={r.listing_id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {bilingualName(r.product_name, r.product_name_am)}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{r.business_name}</p>
                    <p className="text-xs text-zinc-400">
                      {[r.sub_city, r.woreda].filter(Boolean).join(", ")}
                      {formatDistance(r.distance_km) && ` · ${formatDistance(r.distance_km)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {r.price_per_unit} {r.currency}
                    </p>
                    <p className="text-xs text-zinc-500">/ {r.product_unit}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <FreshnessBadge
                    status={r.freshness_status}
                    confidenceTimestamp={r.confidence_timestamp}
                  />
                  <span className="text-xs text-zinc-400">
                    {r.quantity ?? 0} {r.product_unit} listed
                  </span>
                </div>

                <div className="mt-3">
                  <ContactButtons phone={r.phone} />
                </div>
                <div className="mt-2">
                  <ReserveForm
                    listingId={r.listing_id}
                    productName={r.product_name}
                    unit={r.product_unit}
                    availableQuantity={r.quantity}
                    businessName={r.business_name}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
