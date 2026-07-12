"use client";

import { useState } from "react";
import { addListing } from "@/app/dashboard/add-listing/actions";
import { bilingualName, formatCategoryLabel, matchesProductQuery } from "@/lib/products/displayName";

interface ProductOption {
  id: string;
  category: string;
  name: string;
  name_am: string;
  unit: string;
}

export function AddListingForm({ products }: { products: ProductOption[] }) {
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const [category, setCategory] = useState(categories[0] ?? "");
  const [productId, setProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");

  const productsInCategory = products.filter((p) => p.category === category);

  // Same rationale as the buyer search page: with 152 SKUs, typing a
  // few letters is faster than guessing which of 9 categories a
  // product lives in. Empty box falls back to category browsing.
  const trimmedQuery = productQuery.trim();
  const searchMatches = trimmedQuery
    ? products.filter((p) => matchesProductQuery(p.name, p.name_am, trimmedQuery))
    : null;
  const productOptions = searchMatches ?? productsInCategory;

  return (
    <form action={addListing} className="space-y-4">
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
        <label htmlFor="product_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Product
        </label>
        <select
          id="product_id"
          name="product_id"
          required
          value={productId}
          onChange={(e) => {
            const id = e.target.value;
            setProductId(id);
            if (searchMatches) {
              const picked = products.find((p) => p.id === id);
              if (picked) setCategory(picked.category);
            }
          }}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select a product…
          </option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {bilingualName(p.name, p.name_am)} ({p.unit})
              {trimmedQuery ? ` — ${formatCategoryLabel(p.category)}` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {trimmedQuery
            ? `${productOptions.length} match${productOptions.length === 1 ? "" : "es"} for "${trimmedQuery}".`
            : `${productsInCategory.length} product${productsInCategory.length === 1 ? "" : "s"} available in ${formatCategoryLabel(category)}.`}
        </p>
      </div>

      <div>
        <label htmlFor="price_per_unit" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Price per unit (ETB)
        </label>
        <input
          id="price_per_unit"
          name="price_per_unit"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Current quantity in stock
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        disabled={productOptions.length === 0}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Add to my listings
      </button>
    </form>
  );
}
