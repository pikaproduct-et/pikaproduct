export type FreshnessStatus = "fresh" | "aging" | "stale" | "unconfirmed";

/** Human-readable "2h ago" / "3d ago" style relative time, computed
 * client-side from the raw timestamp so it stays accurate even if the
 * page has been open a while (unlike a server-computed "hours ago"
 * string, which would freeze at request time). */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";

  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const FRESHNESS_LABEL: Record<FreshnessStatus, string> = {
  fresh: "Fresh",
  aging: "Aging",
  stale: "Stale",
  unconfirmed: "Unconfirmed",
};

// Tailwind class pairs (dot color, text color) — kept as plain strings
// rather than dynamic template concatenation so Tailwind's static
// analysis picks them up at build time.
export const FRESHNESS_STYLE: Record<FreshnessStatus, { dot: string; text: string }> = {
  fresh: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  aging: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  stale: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  unconfirmed: { dot: "bg-zinc-400", text: "text-zinc-500 dark:text-zinc-400" },
};
