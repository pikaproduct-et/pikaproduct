"use client";

import { useState } from "react";
import { addListing } from "@/app/dashboard/add-listing/actions";

interface ProductOption {
  id: string;
  category: string;
  name: string;
  unit: string;
}

function formatCategoryLabel(category: string) {
  return category.replace(/_/g, " ");
}

export function AddListingForm({ products }: { products: ProductOption[] }) {
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const [category, setCategory] = useState(categories[0] ?? "");
  const [productId, setProductId] = useState("");

  const productsInCategory = products.filter((p) => p.category === category);

  return (
    <form action={addListing} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setProductId("");
          }}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base capitalize dark:border-zinc-700 dark:bg-zinc-900"
        >
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">
              {formatCategoryLabel(c)}
            </option>
          ))}
        </select>
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
          onChange={(e) => setProductId(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select a product…
          </option>
          {productsInCategory.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.unit})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {productsInCategory.length} product{productsInCategory.length === 1 ? "" : "s"} available in{" "}
          {formatCategoryLabel(category)}.
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
        disabled={productsInCategory.length === 0}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Add to my listings
      </button>
    </form>
  );
}
