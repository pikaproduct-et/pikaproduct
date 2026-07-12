"use client";

/**
 * Caches the buyer's last successful search — "last-fetched results
 * cached and viewable with a 'last updated' banner if the buyer loses
 * signal mid-session" (blueprint Section 1). Deliberately a single slot
 * (the most recent search), not a full result-set cache: the point is
 * "don't show a blank screen when you lose signal," not building an
 * offline-first data layer for browsing.
 *
 * localStorage rather than IndexedDB — this is one small JSON blob, not
 * a write-heavy queue (compare src/lib/offline/outbox.ts, which does
 * need IndexedDB for the supplier side).
 */

const STORAGE_KEY = "pikaproduct-last-search";

export interface CachedSearch<TResult> {
  savedAt: string;
  results: TResult[];
}

export function saveSearchCache<TResult>(results: TResult[]) {
  if (typeof window === "undefined") return;
  try {
    const entry: CachedSearch<TResult> = { savedAt: new Date().toISOString(), results };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — caching is
    // a nice-to-have, never worth failing the search over.
  }
}

export function loadSearchCache<TResult>(): CachedSearch<TResult> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSearch<TResult>;
  } catch {
    return null;
  }
}
