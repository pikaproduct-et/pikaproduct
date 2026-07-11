"use client";

import { useEffect, useState } from "react";
import {
  FRESHNESS_LABEL,
  FRESHNESS_STYLE,
  relativeTime,
  type FreshnessStatus,
} from "@/lib/freshness/format";

/**
 * Colored dot + "Fresh · 2h ago" label. Re-renders the relative-time
 * portion every 60s so it doesn't go stale while the dashboard tab sits
 * open — the status itself still comes from the server (listing_status
 * view), this only keeps the displayed age honest.
 */
export function FreshnessBadge({
  status,
  confidenceTimestamp,
}: {
  status: FreshnessStatus;
  confidenceTimestamp: string | null;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const style = FRESHNESS_STYLE[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {FRESHNESS_LABEL[status]} · {relativeTime(confidenceTimestamp)}
    </span>
  );
}
