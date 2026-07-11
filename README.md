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
- [ ] **Phase 1 -- Supplier stock-update flow.** One-tap mobile update, offline-first local write + sync, SMS/USSD fallback hitting the same backend logic. The riskiest, most important piece -- build and prove this before anything buyer-facing.
- [ ] **Phase 2 -- Freshness/decay logic.** Confidence-timestamp-to-staleness computation, category-specific windows.
- [ ] **Phase 3 -- Verification workflow.** Manual supplier verification (badge, admin tooling).
- [ ] **Phase 4 -- Buyer search & compare.** Location-first search (PostGIS proximity), confidence indicators, side-by-side compare view.
- [ ] **Phase 5 -- Reservation/inquiry flow.** Structured reserve/pickup requests, click-to-call/WhatsApp.
- [ ] **Phase 6 -- Offline-tolerant buyer experience.** Cached search results with staleness banners, payload/image compression, data-saver mode.

Payments, logistics, analytics, and bulk CSV upload are explicitly out of scope until Phases 0-6 are proven with real suppliers in one or two dense zones.
