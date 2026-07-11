"use client";

/**
 * Offline-first outbox for stock updates: writes land here immediately
 * (works with zero connectivity), then get flushed to /api/stock when a
 * connection is available. This is the client-side half of the pattern
 * described in the blueprint — "write to local storage immediately,
 * queue and sync opportunistically."
 *
 * Deliberately plain IndexedDB (no dependency) to keep the bundle small,
 * per the blueprint's low-bandwidth-first principle.
 */

const DB_NAME = "pikaproduct-outbox";
const STORE_NAME = "pending_updates";
const DB_VERSION = 1;

export interface PendingUpdate {
  id: string; // client-generated, doubles as idempotency key
  listingId: string;
  quantity: number;
  confidenceTimestamp: string;
  createdAt: string;
  attempts: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    Promise.resolve(fn(store)).then(resolve, reject);
    tx.onerror = () => reject(tx.error);
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueUpdate(update: {
  listingId: string;
  quantity: number;
}): Promise<PendingUpdate> {
  const pending: PendingUpdate = {
    id: crypto.randomUUID(),
    listingId: update.listingId,
    quantity: update.quantity,
    confidenceTimestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await withStore("readwrite", (store) => requestToPromise(store.put(pending)));
  return pending;
}

export async function getPendingUpdates(): Promise<PendingUpdate[]> {
  return withStore("readonly", (store) => requestToPromise(store.getAll()));
}

export async function removePendingUpdate(id: string): Promise<void> {
  await withStore("readwrite", (store) => requestToPromise(store.delete(id)));
}

async function bumpAttempts(update: PendingUpdate): Promise<void> {
  await withStore("readwrite", (store) =>
    requestToPromise(store.put({ ...update, attempts: update.attempts + 1 }))
  );
}

export interface FlushResult {
  synced: number;
  remaining: number;
  failed: number;
}

/**
 * Sends every queued update to the server, oldest first (so last-write-wins
 * ordering on the server matches intent). Network failures leave the item
 * queued for the next flush; a rejected update (bad listing, RLS denial)
 * is dropped after logging — retrying it would never succeed.
 */
export async function flushQueue(): Promise<FlushResult> {
  const pending = (await getPendingUpdates()).sort((a, b) =>
    a.confidenceTimestamp.localeCompare(b.confidenceTimestamp)
  );

  let synced = 0;
  let failed = 0;

  for (const update of pending) {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: update.listingId,
          quantity: update.quantity,
          confidenceTimestamp: update.confidenceTimestamp,
        }),
      });

      if (res.ok) {
        await removePendingUpdate(update.id);
        synced += 1;
      } else if (res.status >= 400 && res.status < 500) {
        // Won't succeed on retry (bad request / not authorized) — drop it
        // rather than queue forever.
        await removePendingUpdate(update.id);
        failed += 1;
      } else {
        await bumpAttempts(update);
      }
    } catch {
      // Offline or network error — leave queued, try again next flush.
      await bumpAttempts(update);
    }
  }

  const remaining = (await getPendingUpdates()).length;
  return { synced, remaining, failed };
}

let listenerRegistered = false;

/** Call once from a client component (e.g. the dashboard) to auto-flush
 * on load and whenever the browser regains connectivity. */
export function registerAutoFlush(onFlush?: (result: FlushResult) => void) {
  if (listenerRegistered || typeof window === "undefined") return;
  listenerRegistered = true;

  const run = () => {
    flushQueue().then((result) => onFlush?.(result));
  };

  window.addEventListener("online", run);
  run(); // attempt immediately on mount, in case we're already online with a backlog
}
