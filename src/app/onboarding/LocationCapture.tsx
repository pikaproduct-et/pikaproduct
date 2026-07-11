"use client";

import { useState } from "react";

/**
 * Hidden lat/lng fields filled in via the browser Geolocation API.
 * Falls back gracefully — location is optional at onboarding time;
 * a supplier without it just won't show up in proximity search until
 * they set it (verification step can also backfill this).
 */
export function LocationCapture() {
  const [status, setStatus] = useState<"idle" | "locating" | "done" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function capture() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("done");
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
      <button
        type="button"
        onClick={capture}
        className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
      >
        {status === "done"
          ? "Location captured ✓"
          : status === "locating"
            ? "Locating…"
            : "Use my current location"}
      </button>
      {status === "error" && (
        <p className="text-sm text-amber-600">
          Couldn&apos;t get your location — you can still continue and add it later.
        </p>
      )}
    </div>
  );
}
