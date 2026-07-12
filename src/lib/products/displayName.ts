// Shared "English (Amharic)" formatter — every surface that shows a
// product name (add-listing form, buyer search dropdown + results,
// supplier stock dashboard) should render it the same way, so this is
// the one place that decides the format instead of each component
// reimplementing string concatenation slightly differently.
export function bilingualName(name: string, nameAm: string | null | undefined) {
  const trimmed = nameAm?.trim();
  return trimmed ? `${name} (${trimmed})` : name;
}
