// Shared "English (Amharic)" formatter — every surface that shows a
// product name (add-listing form, buyer search dropdown + results,
// supplier stock dashboard) should render it the same way, so this is
// the one place that decides the format instead of each component
// reimplementing string concatenation slightly differently.
export function bilingualName(name: string, nameAm: string | null | undefined) {
  const trimmed = nameAm?.trim();
  return trimmed ? `${name} (${trimmed})` : name;
}

// products.category is a lowercase, underscore-separated slug
// (e.g. "aggregates_blocks", "doors_windows") — fine as a DB key, not
// fine to show a buyer/supplier directly. This turns it into a
// readable label ("Aggregates blocks", "Doors windows") without
// needing a separate lookup table for 9 categories.
export function formatCategoryLabel(category: string) {
  const spaced = category.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Client-side keyword filter used by both the buyer search page and
// the supplier add-listing page now that the catalog has 152 SKUs —
// matches against the English name case-insensitively and the Amharic
// name as-is (Ge'ez script has no case distinction, so lowercasing it
// would be a no-op at best and incorrect for mixed Latin/Ge'ez terms
// like "PVC" at worst).
export function matchesProductQuery(name: string, nameAm: string, query: string) {
  const q = query.trim();
  if (!q) return true;
  const qLower = q.toLowerCase();
  return name.toLowerCase().includes(qLower) || nameAm.includes(q);
}
