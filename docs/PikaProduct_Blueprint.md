# PikaProduct: Foundational Product & Technical Blueprint

*Hyper-local, real-time inventory marketplace for engineering commodities — Ethiopian market*

---

## Before the roadmap: know your real competition

A quick scan of the Ethiopian construction-materials space turns up sites like Conmaret, 2Merkato's "Concrete Work Material Prices," and Addis Cost Estimator — all of them **static, manually-updated price lists**, not live inventory. That's actually good news: it confirms demand for price/material information exists, but nobody has cracked the "is this actually in stock, right now, near me" problem. That gap — phantom stock — is where PikaProduct should draw its entire MVP around. Every feature decision below should be tested against one question: does this help close the gap between "listed" and "actually on the shelf"?

---

## 1. Feature Roadmap: MVP vs. Phase 2

The organizing principle for the MVP is **trust the number on the screen**. A marketplace that shows inventory nobody can rely on is worse than no marketplace — it trains buyers to call the supplier anyway, and you've built a directory, not a marketplace. Everything that doesn't directly serve "accurate stock, right now, nearby" gets pushed to Phase 2.

### Supplier Dashboard

**Day 1 (MVP) — must ship:**

- **One-tap stock update via mobile.** A supplier standing in a warehouse needs to update "50 quintals of 12mm rebar" in under 10 seconds, on a low-end Android phone, on 3G. This is not a nice-to-have — it's the product. If updating stock is harder than calling a buyer directly, suppliers won't use it.
- **SMS/USSD fallback for stock updates.** Many yard managers and warehouse foremen are not comfortable with app UIs, and connectivity in industrial zones (e.g., Akaki, Kaliti, Alem Gena) is inconsistent. A structured SMS format ("STOCK REBAR12 50 QTL") or a USSD menu should update the same backend record as the app. This alone will differentiate you from every "app-only" competitor that fails outside Addis.
- **Stock decay / auto-expiry on quantities.** Every listed quantity should have a "confidence timestamp." If a supplier hasn't confirmed stock in, say, 48–72 hours, the listing visibly downgrades (e.g., from "In Stock: 50 qtl" to "Last confirmed 3 days ago — call to confirm") rather than silently staying green. This is your core defense against phantom stock and it needs to exist from day one, not be bolted on later.
- **Simple SKU catalog limited to a fixed taxonomy.** Don't let suppliers free-type product names — you'll get "rebar," "Rebar 12mm," "steel bar 12," and "12 iron" for the same item. Ship with a curated, category-based taxonomy (rebar by diameter, cement by brand/grade, pipe by material/diameter, electrical by type/gauge) so search and price comparison actually work.
- **Basic pricing input (per unit) with currency locked to ETB.** No multi-currency complexity for MVP.
- **Verification badge workflow.** Manual, human-in-the-loop verification (business license check, physical site visit or phone confirmation, TIN check) before a supplier goes live. This is slow and doesn't scale, but for MVP, trust is the product — a handful of verified suppliers with real stock beats hundreds of unverified ones.
- **Order/inquiry inbox.** Buyers submit a request or "reserve" intent; suppliers accept/decline/counter via app or SMS. Not a full checkout flow — a structured lead/reservation flow.

**Phase 2 — defer:**

- Bulk CSV/API inventory upload for larger suppliers or ERP integration.
- Multi-branch/warehouse management under one supplier account.
- Automated stock decrement tied to completed transactions (requires payment/logistics maturity first).
- Analytics dashboard (views, conversion, competitor pricing benchmarks).
- Delivery/logistics coordination tools.
- Dynamic/tiered pricing (volume discounts, contractor accounts).
- Supplier-to-supplier stock transfer/marketplace (B2B2B).

### Buyer Interface (Contractors, Engineers, Procurement Officers)

**Day 1 (MVP) — must ship:**

- **Location-first search.** The very first interaction should be "what do you need" + "where's your site," returning results sorted by proximity, not just relevance. Distance-to-site is your single biggest value prop over a phone-call-based sourcing habit — it needs to be the default view, not a filter.
- **"Confidence" indicator on every listing**, tied directly to the supplier-side decay logic above (e.g., a green/yellow/red dot with "confirmed 2 hrs ago" language). Buyers need to instantly gauge whether a listing is worth a trip or a call.
- **Click-to-call and click-to-WhatsApp/Telegram on every listing.** Ethiopian B2B buying culture is relationship- and voice-driven (see Section 3). Don't force a buyer through an in-app checkout if they'd rather call — make the call/WhatsApp path a first-class, prominent action, not an afterthought buried in a profile page.
- **Simple compare view** — same SKU across 3–5 nearby verified suppliers, price + distance + confidence side by side. This is the "aha" moment of the product.
- **Lightweight reservation/inquiry request**, not full checkout. "Reserve 20 quintals, I'll pick up within 24 hrs" sent as a structured request the supplier can accept via SMS.
- **Offline-tolerant browsing** — last-fetched results cached and viewable with a "last updated" banner if the buyer loses signal mid-session (critical on construction sites, often at the edge of network coverage).

**Phase 2 — defer:**

- In-app payments/escrow (needs deep integration with Telebirr, M-Pesa Ethiopia, and bank rails — high complexity, tackle after transaction volume justifies it).
- Delivery booking/logistics marketplace.
- Buyer accounts with saved project BOQs (bills of quantities) and recurring order templates.
- Ratings/reviews at scale (start with verification instead; reviews are gameable early and add little value with a small supplier base).
- Price-trend analytics / market intelligence dashboards for procurement officers.
- Multi-user company accounts with approval workflows (useful for larger contractors, not needed for MVP liquidity).

The through-line: **MVP is a two-sided trust layer with location and freshness at its core; Phase 2 is transaction depth (payments, logistics, analytics).** Don't build payments or logistics until you've proven suppliers will keep stock data fresh — that's the harder, more foundational problem, and no amount of checkout polish fixes a marketplace where the numbers are wrong.

---

## 2. Technical Architecture & Data Strategy

### Schema strategy: separate "catalog" from "stock state"

The biggest mistake in fast-changing inventory systems is treating a product listing and its stock level as one write-heavy row. Split them:

- **`suppliers`** — id, business name, verification status, location (lat/lng + woreda/sub-city), phone, verified_at.
- **`products`** (catalog, near-static) — id, category, sub-category, canonical name, unit of measure, attributes (diameter, grade, brand) as structured columns or JSONB, not free text.
- **`listings`** — supplier_id, product_id, price_per_unit, currency (ETB only for MVP).
- **`stock_state`** (the hot table) — listing_id, quantity, confidence_timestamp, updated_by (app/SMS/USSD), status (fresh / stale / unconfirmed). This table gets frequent small writes and should be optimized for that: narrow rows, indexed on (product_id, updated location) for search, and importantly *not* joined with heavy supplier profile data on every read.

Keep `stock_state` narrow and separate so that a burst of supplier updates (e.g., every yard checking in each morning) doesn't lock or bloat the tables buyers are querying for search. In Postgres, this also lets you tune autovacuum and indexing independently for a table with a very different write pattern than the rest of the schema.

For "freshness," store a timestamp, not a boolean. Compute staleness (fresh/aging/stale) at read time based on a category-specific decay window — fast-moving categories like rebar might decay to "unconfirmed" after 48 hours, while something like structural steel beams (slower turnover) might get 5–7 days. Hardcoding a single global staleness rule will misrepresent at least one major category.

### Handling intermittent connectivity: sync, don't stream

Real-time in your value prop doesn't mean WebSockets-everywhere — it means "the number you see reflects a recent, trustworthy check-in," which is a very different (and much cheaper) engineering problem in a low-bandwidth environment.

- **Supplier side — offline-first local write, then sync.** The supplier app should write stock updates to local storage immediately (instant UI feedback, works with zero signal), then queue and sync to the server opportunistically. Treat every update as an event with a client-generated timestamp and idempotency key, so a retry after a dropped connection never double-counts or creates duplicate stock records. A simple outbox pattern (local queue table, background sync worker, exponential backoff) handles this without needing a heavyweight offline-sync framework for MVP.
- **Buyer side — cache last-known-good results with explicit staleness UI**, rather than pretending you have live data when the buyer's own connection drops. Service worker or local SQLite cache (depending on stack — see below) storing the last successful search result set, tagged with a fetch timestamp, is enough for MVP. Don't hide staleness from the buyer; surface it — trust comes from honesty about freshness, not from faking real-time.
- **SMS/USSD as a first-class sync channel, not a fallback bolt-on.** Design the backend to accept stock updates from three input paths (app, SMS gateway via a local aggregator like Africa's Talking or a local telecom SMPP connection, USSD) writing to the *same* `stock_state` table through the same validation logic. This matters because your highest-value suppliers (busy yard managers) may never touch the app UI at all.
- **Payload discipline.** Every API response for the buyer app should be JSON, gzip-compressed, and paginated aggressively (10–15 results per page, not 100). Images should be served through a CDN with aggressive resizing/WebP compression — a single uncompressed photo can cost a buyer real, felt money on a pay-per-MB plan. Build a "data saver" mode that defaults to text-only listings with images loaded on tap, not automatically.
- **Push vs. poll.** Don't build persistent WebSocket connections for MVP — they're expensive to maintain reliably over flaky mobile networks and add real infrastructure cost for a feature (instant live updates) buyers don't need at MVP stage. Polling on a reasonable interval (or pull-to-refresh) combined with honest staleness timestamps gets you 90% of the trust benefit at a fraction of the engineering and bandwidth cost.

### Stack notes specific to your constraints

- **Next.js/React** — lean into static generation and aggressive code-splitting for the buyer-facing search/browse flow; keep the initial JS bundle small (target under ~150KB gzipped for the core search page) since first-load performance on a budget Android device over 3G is your real benchmark, not a developer's laptop on office WiFi.
- **Node.js backend** — keep the stock-update endpoint dead simple and fast (single table write, minimal joins) since this is your highest-frequency, highest-value write path.
- **PostgreSQL** — use PostGIS for proximity search (`ST_DWithin`/`ST_Distance` on supplier lat/lng) rather than building your own distance math; it's a solved problem and PostGIS handles it efficiently even at moderate scale.
- **Consider a lightweight local-first layer** (e.g., SQLite via `expo-sqlite` if you go React Native/Expo for the supplier app, or IndexedDB for a PWA) so supplier stock updates work with zero connectivity and sync when a signal reappears. A PWA (installable, offline-capable, no app store friction) is worth strongly considering over native apps for both sides — it lowers distribution friction for suppliers who may be wary of installing an unfamiliar native app, and it's easier for you to iterate quickly pre-product-market-fit.

---

## 3. Localized Challenges & Solutions

### 1. Verification trust runs through relationships, not documents

Ethiopian B2B commerce — especially in construction materials — still runs heavily on personal trust networks, broker relationships, and word of mouth. A "verified" badge from an unfamiliar app won't override years of buying from the same known supplier by phone. Digital verification alone will feel abstract and unconvincing to a buyer risking real money on a real construction deadline.

**Product response:** Don't just badge suppliers — make the *reason* for trust visible and social. Show how long a supplier has been active on the platform, transaction/reservation counts (even small early numbers, framed honestly, e.g. "12 reservations fulfilled"), and where possible, real photos of the actual yard/warehouse taken at verification time (not stock photos). Consider a "co-sign" mechanism early on: let a small set of known, respected contractors or engineering firms publicly vouch for a supplier they already work with — borrowing existing trust networks into the platform rather than asking users to trust the platform itself from zero.

### 2. Informal, cash-and-negotiation business habits vs. fixed digital pricing

A lot of materials pricing in Ethiopia is negotiated on the spot, varies by relationship, order size, and even by how the deal is paid (cash vs. transfer, birr vs. informal forex-adjusted pricing on imported goods like steel). A rigid "the price is X" listing can feel dishonest to suppliers used to negotiating, and buyers may distrust a price that seems too fixed or too clean.

**Product response:** Treat the listed price as a *reference/starting* price, not a locked checkout price — frame it explicitly as "Listed price — confirm with supplier," and build the reservation/inquiry flow (not a rigid cart) as the mechanism that opens a real conversation (call/WhatsApp) where final terms get worked out, same as today, just with far better discovery upfront. This respects existing negotiation culture instead of fighting it, while still solving the actual pain point (finding who has stock, nearby, at roughly what price) rather than trying to digitize the entire negotiation on day one.

### 3. Imported-materials pricing volatility (forex exposure)

A meaningful share of steel and other engineering inputs are imported, and Ethiopia's forex environment (official vs. parallel/black-market exchange rates, historically) has made landed costs volatile and sometimes opaque — a price a supplier quotes today may not hold in a week if they need to restock. This isn't something a marketplace can solve directly, but pretending prices are stable will erode trust fast.

**Product response:** For import-exposed categories, add a lightweight "price last updated" and optionally a "price volatility" flag distinct from the stock-freshness indicator — i.e., separate "is this in stock" confidence from "is this price still valid" confidence, since they decay at different rates and for different reasons. This also creates a natural, honest product surface for suppliers to say "call to confirm current price" on volatile SKUs without it looking like a broken listing.

### 4. Telecom/connectivity is improving fast but is still uneven and cost-sensitive

The telecom picture in Ethiopia has shifted meaningfully: Safaricom Ethiopia has driven data prices down and expanded 4G coverage alongside Ethio Telecom's own rapid rollout, and mobile money is now genuinely competitive — Telebirr has tens of millions of users, and M‑Pesa Ethiopia's usage has grown sharply since gaining interoperability with EthSwitch and Ethiopia's national payment rails in late 2025. That's a real tailwind. But coverage and affordability are still uneven outside Addis Ababa and in industrial/warehouse zones specifically, where suppliers' physical stock actually sits, and data costs are still a real, felt expense for a warehouse worker on a personal data plan.

**Product response:** Build for the two-tier reality directly rather than assuming uniform connectivity: keep the SMS/USSD stock-update path as a permanent, first-class feature (not a launch-only crutch), and design payments/reservations to plug into whichever mobile money rail a given buyer or supplier already uses rather than picking one exclusively — with EthSwitch interoperability now live, a listing shouldn't need to care whether the counterpart prefers Telebirr or M-Pesa. This future-proofs you against the market's continuing telecom shifts instead of betting the product on one operator's ecosystem.

---

## 4. Next Steps: Prioritized Checklist

**Validate before building more:**

1. **Talk to 15–20 suppliers (yard managers/wholesalers) before writing another line of product code.** Specifically test: will they actually update stock daily via SMS/USSD or app? Time them doing a mock update — if it takes more than ~15 seconds or requires a smartphone they don't have, redesign before building.
2. **Talk to 15–20 buyers (contractors/procurement officers)** about how they currently source materials, how far they're willing to travel to save on price/logistics, and whether "distance to site" genuinely changes their sourcing decision or if relationship/credit terms dominate. This determines whether "hyper-local" is really your strongest wedge or whether trust/credit terms need to lead instead.
3. **Pressure-test the verification workflow cost.** Manually verifying suppliers (site visits, license checks) is slow and won't scale — figure out your real cost-per-verified-supplier before assuming you can onboard hundreds quickly. This number should shape your fundraising/runway assumptions.

**Build first (in order):**

4. Curated product taxonomy for your first 2–3 categories only (recommend starting with rebar and cement — highest frequency, most standardized SKUs, easiest to verify pricing against public reference data you already have access to).
5. Supplier stock-update flow (app + SMS/USSD) against the `stock_state` schema described above — this is the single riskiest, most important piece of engineering. Nothing else matters if this doesn't work reliably offline.
6. Buyer location-first search + compare view, with staleness indicators wired to real decay logic from day one, not added later.
7. Manual verification workflow and onboard your first 10–15 real, verified suppliers in one or two neighborhoods/industrial zones — deliberately small and dense rather than broad and thin, so buyers searching nearby actually get useful results.
8. Reservation/inquiry flow connecting buyers to suppliers via call/WhatsApp, instrumented so you can measure whether inquiries convert to real pickups (your true north-star metric, more important than listings count or app downloads).

**Sequencing discipline:** resist the pull toward payments, logistics, or a broad product catalog before the freshness/trust loop is proven with a small, dense supplier base in one or two zones. A liquid, trustworthy micro-market in rebar and cement in one industrial cluster is worth more at this stage than a thin, stale listing across every material category in every city.

---

*Sources consulted for current market context: [Safaricom Ethiopia data pricing](https://shega.co/news/safaricom-ethiopia-raises-data-prices-amid-financial-sustainability-drive), [Ethio Telecom vs. Safaricom competition](https://weetracker.com/2025/10/07/ethio-telecom-vs-safaricom-world-bank-report-sounds-monopoly-alarm/), [Ethio Telecom 4G expansion](https://www.ecofinagency.com/news-digital/0206-56088-ethiopias-incumbent-operator-extends-4g-coverage-to-52-new-cities), [Telebirr vs. M-Pesa Ethiopia](https://kenyanwallstreet.com/telebirr-m-pesa-analysis), [M-Pesa Ethiopia growth & EthSwitch interoperability](https://techafricanews.com/2026/02/02/safaricom-ethiopia-surpasses-12-million-users-as-m-pesa-adoption-grows/), [2026 Ethiopia construction material prices](https://conmaret.com/construction-material-price-list-in-ethiopia-2026/), [2026 cement prices](https://conmaret.com/cement-prices-in-ethiopia-today-2026-complete-guide/).*
