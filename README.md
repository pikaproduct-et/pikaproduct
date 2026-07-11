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
- [ ] **Phase 3 -- Verification workflow.** Manual supplier verification (badge, admin tooling).
- [ ] **Phase 4 -- Buyer search & compare.** Location-first search (PostGIS proximity), confidence indicators, side-by-side compare view.
- [ ] **Phase 5 -- Reservation/inquiry flow.** Structured reserve/pickup requests, click-to-call/WhatsApp.
- [ ] **Phase 6 -- Offline-tolerant buyer experience.** Cached search results with staleness banners, payload/image compression, data-saver mode.

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
