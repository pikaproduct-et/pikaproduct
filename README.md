# PikaProduct

Hyper-local, real-time inventory marketplace for engineering commodities (steel, cement, electrical, piping) in Ethiopia. Connects verified suppliers/wholesalers with contractors, engineers, and procurement officers — solving "phantom stock" by showing what's actually on the shelf, right now, nearby.

Full product/technical blueprint: [`docs/PikaProduct_Blueprint.md`](docs/PikaProduct_Blueprint.md).

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — frontend + API routes
- **Supabase** (Postgres + PostGIS + Auth + Storage) — backend

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a [Supabase project](https://supabase.com/dashboard) if you don't have one yet.
3. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL, anon key, and service role key (Project Settings -> API in the Supabase dashboard):
   ```bash
   cp .env.example .env.local
   ```
4. Run the database migrations against your Supabase project. Easiest path is the Supabase CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   Alternatively, paste the contents of `supabase/migrations/0001_init.sql` and `0002_seed_taxonomy.sql` into the Supabase dashboard's SQL Editor and run them in order.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — the homepage will confirm whether your Supabase env vars are picked up correctly.

## Pushing to GitHub

```bash
git init   # already done if you're reading this from a cloned repo
git add .
git commit -m "Phase 0: project scaffold, Supabase wiring, DB schema"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Project structure

```
src/
  app/                  Next.js App Router pages
  lib/
    supabase/
      client.ts         Browser Supabase client
      server.ts         Server Component / Route Handler Supabase client + admin client
    types/
      database.ts       Hand-written types matching the schema (regenerate via Supabase CLI once linked)
supabase/
  migrations/
    0001_init.sql        Core schema: suppliers, products, listings, stock_state + RLS
    0002_seed_taxonomy.sql  Starter product catalog (rebar + cement only)
docs/
  PikaProduct_Blueprint.md  Full product/technical blueprint
```

## Schema notes

The schema deliberately separates the near-static catalog (`products`, `listings`) from the high-write, fast-changing `stock_state` table — one row per listing, holding `quantity` and a `confidence_timestamp`. Freshness (fresh / aging / stale) is computed at read time using category-specific decay windows, not stored as a static flag. See the blueprint, Section 2, for the full reasoning.

## Build roadmap

This repo is being built in phases, in order — each one only makes sense once the previous is solid:

- [x] **Phase 0 -- Foundations.** Repo scaffold, Supabase wiring, DB schema (`suppliers`, `products`, `listings`, `stock_state`).
- [x] **Phase 1 -- Supplier stock-update flow.** Auth + onboarding, one-tap mobile update dashboard, offline-first IndexedDB outbox + auto-sync, SMS webhook fallback hitting the same `upsert_stock_state` function as the app.
- [x] **Phase 2 -- Freshness/decay logic.** Category-specific decay windows on `products`, `listing_status` view computing fresh/aging/stale/unconfirmed at read time, freshness badge on the supplier dashboard.
- [x] **Phase 3 -- Verification workflow.** Admin allowlist + RLS-enforced verify/reject tooling at `/admin/suppliers`.
- [x] **Phase 4 -- Buyer search & compare.** Public `/search` page, `search_listings` PostGIS proximity function, freshness badges reused from Phase 2, click-to-call/WhatsApp.
- [x] **Phase 5 -- Reservation/inquiry flow.** `reservations` table (account-free buyer inserts, RLS-locked to pending/unresponded), reserve form on search results, supplier inbox at `/dashboard/inquiries` with accept/decline.
- [x] **Phase 6 -- Offline-tolerant buyer experience.** localStorage cache of the last search with an honest staleness banner, aggressive result pagination, data-saver toggle.

Payments, logistics, analytics, and bulk CSV upload are explicitly out of scope until Phases 0-6 are proven with real suppliers in one or two dense zones.

## Phase 1 notes

- **Auth** is email/password via Supabase Auth (simplest zero-config option). Phone is captured separately during onboarding and used to match inbound SMS to a supplier — it is not a login credential yet.
- **SMS webhook** lives at `POST /api/sms/webhook`, built against Africa's Talking's inbound-message shape (form-encoded `from`/`text`). Point your SMS gateway's inbound webhook URL at `https://<your-deployment>/api/sms/webhook` once you have a provider account. Message format: `STOCK <CODE> <QTY>`, e.g. `STOCK REBAR12 50` — codes are in `products.sms_code` (migration `0003`). Outbound confirmation replies are stubbed (logged, not sent) until a gateway API key is wired in — see `sendSmsReply` in `src/app/api/sms/webhook/route.ts`.
- **Offline outbox** (`src/lib/offline/outbox.ts`) is plain IndexedDB, no dependency. Updates save locally first and sync automatically on reconnect; last-write-wins ordering is enforced server-side in `upsert_stock_state` (migration `0003`) by comparing client-supplied timestamps, so a late-syncing offline update can never clobber a newer one.
- Run the new migrations (`0003`, `0004`) the same way as `0001`/`0002` — `supabase db push` or paste into the SQL Editor, in order.

## Phase 2 notes

- **`listing_status`** (migration `0005`) is the single read model for freshness — computed with `security_invoker = true` so it enforces the same RLS as the underlying tables rather than leaking unverified/inactive suppliers' data. It's built to be reused by buyer search in Phase 4, not just the supplier dashboard.
- **Decay windows are per-category**, not global: `products.freshness_window_hours` (rebar 48h, cement 120h by default). Aging starts at 1x the window, stale at 2x. Adjust per-category or per-product as real usage data comes in.
- The dashboard's freshness badge re-renders its relative-time text every 60s client-side so it doesn't visibly go stale while the tab sits open, even though the fresh/aging/stale classification itself is computed server-side per request.

## Phase 3 notes

- **Bootstrapping the first admin**: there's no signup path for admin access on purpose. After running migration `0006`, find your user id (Supabase dashboard -> Authentication -> Users, or `select id from auth.users where email = 'you@example.com'`) and run:
  ```sql
  insert into admins (user_id) values ('<your-user-id>');
  ```
  Then visit `/admin/suppliers` while signed in.
- **Authorization is RLS-enforced, not just UI-gated**: `/admin/suppliers` uses the caller's own authenticated Supabase client (not the service-role client) for every read and write. The `is_admin()` Postgres function backs the RLS policies on `suppliers` (migration `0006`), so even a bug in the page/action code couldn't let a non-admin see or edit supplier data — the database itself refuses the query.
- Verify/reject just sets `verification_status` (+ `verified_at`/`verified_by`); it doesn't lock a pending or rejected supplier out of their dashboard — per the blueprint, they can keep updating stock while waiting on review.

## Phase 4 notes

- **`search_listings`** (migration `0007`) is the single query behind `/search` — it joins `listing_status` (Phase 2) with `suppliers` for location/contact info, computes distance with PostGIS when the buyer shares their location, and works identically whether you leave the product filter open (browse a category) or pick one exact product (true SKU-level compare, per the blueprint's "aha moment"). No separate compare endpoint needed.
- **No buyer account required** — `/search` is public, calling the RPC with the anon key. This matches the blueprint's MVP scope: buyers browse and contact suppliers directly (call/WhatsApp), no checkout yet. Reservation requests are Phase 5.
- **Location is optional, not required**: if a buyer declines geolocation, results still return (unsorted by distance, `distance_km` is `null`) rather than blocking search entirely.
- Run migration `0007` the same way as the others (`supabase db push`) before testing.

## Phase 5 notes

- **Still not a checkout** — accepting a reservation only changes its status; it does not touch `stock_state` or decrement quantity. Per the blueprint, automated stock decrement tied to completed transactions is deliberately out of scope until payments/logistics exist (Phase 2-of-the-original-roadmap territory), which is well past Phase 6.
- **The insert policy's `WITH CHECK` is intentionally strict**: `status = 'pending' and responded_at is null and responded_by is null`, regardless of what a caller sends. Since buyers submit without an account using the public anon key, RLS — not the app UI — is what stops someone from directly inserting a pre-accepted reservation via the REST API.
- **SMS notification on a new inquiry is stubbed** the same way the Phase 1 webhook confirmations are — logged via the shared `sendSms()` helper (`src/lib/sms/notify.ts`, refactored out of the webhook route so both flows share one place to wire up a real gateway later).
- Run migration `0008` the same way as the others (`supabase db push`) before testing.

## Phase 6 notes

- **`src/lib/offline/searchCache.ts`** caches only the buyer's *last* successful search (single slot, localStorage) — not a general offline data layer. The point, per the blueprint, is "don't show a blank screen if the buyer loses signal mid-session," not building full offline browsing.
- **The staleness banner never hides that data is old.** If a fresh search fails (offline, or the request just errors), `/search` falls back to the cached results and says so explicitly with a relative-time label and a manual Refresh button — matching the blueprint's "don't hide staleness from the buyer; surface it."
- **No polling, no WebSockets** — deliberately. Refresh is always a manual, explicit action (button tap), per the blueprint's guidance that persistent connections aren't worth the infra cost or battery/data drain at this stage.
- **`search_listings` now caps results** at `p_limit` (default 15, data saver mode requests 8, hard ceiling 50 server-side regardless of what's requested) instead of returning everything that matches.
- **Data saver mode** also switches geolocation to `enableHighAccuracy: false` — cheaper network/cell-tower positioning instead of GPS, which is plenty accurate for "which supplier is nearby" and lighter on battery/data.
- **Image compression from the original blueprint guidance doesn't apply yet** — there are no listing photos anywhere in the current schema, so there's nothing to compress. Worth revisiting if/when supplier photos are added.
- Run migration `0009` the same way as the others (`supabase db push`) before testing.

---

That's the full six-phase roadmap from the original blueprint. Everything past this point — payments, logistics, analytics, bulk CSV upload, multi-branch suppliers — is explicitly out of scope until this MVP is proven with real suppliers in one or two dense zones (see the blueprint's own "Next Steps" section).

## Product taxonomy expansion (migration 0010)

The catalog grew from 9 SKUs (rebar + cement only) to 152, adding six new categories: `aggregates_blocks`, `structural_steel`, `plumbing`, `electrical`, `roofing`, `finishing`, `doors_windows` — plus more rebar sizes and cement brands under the two original categories.

- **Deduplication was checked twice**: once at generation time (a Python script asserted no collisions in `sub_category`, `name`, or `sms_code` against the existing 9 rows or within the new 143, before any SQL was written), and again at the database level via a new `products_sub_category_unique` constraint plus `on conflict (sub_category) do nothing` on the insert — so re-running the migration, or a future migration adding overlapping items, can't silently duplicate a product.
- **Each new category got a freshness window** (migration 0005's category-specific decay logic extended, not replaced): `aggregates_blocks` 48h (high-turnover, same tier as rebar), `structural_steel` 72h (default), `plumbing`/`electrical` 96h, `roofing`/`finishing` 120h (same tier as cement), `doors_windows` 168h (slowest-moving, often made-to-order). These are starting guesses, not measured data — revisit once real suppliers are updating stock.
- **SMS codes were deliberately not added for most of the 143 new products.** The SMS stock-update path only scales to a curated handful of SKUs a supplier can realistically remember or text without looking anything up — see the blueprint's rationale for starting narrow. Only the new rebar sizes (6/14/20/24/32mm) got `sms_code`s, matching the existing pattern. If specific new products turn out to be high-SMS-frequency in practice, add codes for those deliberately rather than all 143 at once.
- Run migration `0010` the same way as the others (`supabase db push`) before it shows up in `/dashboard/add-listing` or `/search`.

## Add-listing UI: category-first product picker

With 152 SKUs in the catalog, a single flat product dropdown stopped being usable. `/dashboard/add-listing` now uses `src/components/AddListingForm.tsx` (client component): a **Category** select filters the **Product** select beneath it, so a supplier picks their trade (e.g. `electrical`) before scanning a list of names, instead of scrolling through all 152 at once. This mirrors the pattern already used on the buyer side (`BuyerSearch.tsx`, Phase 4) rather than introducing a new UI convention.

- Category is client-side-only filtering — it isn't submitted with the form; only the selected `product_id` is. The available product list itself (already-listed products excluded) is still fetched server-side in `page.tsx`, same as before.
- If a supplier has already listed every product in a category, that category simply doesn't appear in the dropdown (it's derived from the filtered "available" list, not the full catalog).

## Amharic product names (migration 0011)

Since this is an Ethiopian-market product, every product now carries a native Amharic name alongside the English one — `products.name_am` (new column, `not null`), shown everywhere a product name is displayed as **"English (Amharic)"**.

- **Separate column, not baked into `name`**: keeps English and Amharic independently searchable/sortable, and keeps `products.name` (used by SMS matching and existing sort/filter queries) untouched. `src/lib/products/displayName.ts` has the single `bilingualName()` formatter every UI surface calls, so the "English (Amharic)" format can't drift between components.
- **`listing_status` and `search_listings`** (both re-created in this migration) now return `product_name_am` alongside `product_name`, so the supplier dashboard and buyer search/compare get the bilingual name in the same query — no second round-trip to `products`.
- **Coverage is enforced at migration time**: a `do $$ ... raise exception ...` block fails the migration if any product is left without a translation, and `name_am` is set `not null` only after that check passes — a future product insert that forgets a translation will fail loudly rather than silently shipping English-only.
- **Translation approach**: standard Ethiopian construction-trade terminology — native Amharic where a common native term exists, transliteration for modern technical terms without an established native equivalent (PPR, PVC, RHS, LED, aggregate, etc.), matching how these items are actually named in hardware shops and on construction sites today rather than a literal dictionary translation. Treat these as a solid first pass — worth a native-speaker review pass with real suppliers before this is customer-facing at scale, especially for the more technical/compound terms.
- Run migration `0011` the same way as the others (`supabase db push`) before the Amharic names show up anywhere.
