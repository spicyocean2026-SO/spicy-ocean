# Spicy Ocean — Project Documentation

A restaurant point-of-sale (POS) web app for **Spicy Ocean**, built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind/shadcn**, backed by **MongoDB (Atlas)**.

This document summarizes everything that was built and changed, the architecture, the APIs, how to run it, and how to operate it.

---

## 1. High-level summary of work done

| # | Work item | Outcome |
|---|-----------|---------|
| 1 | **Migrated Vite + React Router SPA → Next.js 16 App Router** | Same UI/features, now on Next.js with server APIs. |
| 2 | **Upgraded to Next.js 16 + React 19** | Latest framework, Turbopack builds, flat ESLint, `proxy.ts`. |
| 3 | **Removed unused config** | Deleted Vite/Playwright scaffolding; fixed `components.json`. |
| 4 | **Added a MongoDB backend (Mongoose)** in the same app | Connection helper + models + API routes. |
| 5 | **Personal Information profile** (read-only + edit) | `Profile` model + `/api/profile`, `/profile` page. |
| 6 | **Authentication** (login + signup, app gated) | `User` model, JWT cookie sessions, signup "creation password", route gating. |
| 7 | **Ordering flow moved to the backend** | Menu + Orders APIs; Dine-In → Kitchen → Counter with live polling + ready notification. |
| 8 | **MongoDB Atlas connection** | App connected to the cloud cluster. |
| 9 | **Seed script + test account** | `npm run seed` creates a test login + sample profile. |
| 10 | **Pushed to GitHub** | `spicyocean2026-SO/spicy-ocean`, authored by `spicyocean2026`. |

---

## 2. Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **UI:** Tailwind CSS, shadcn/ui (Radix), Framer Motion, lucide-react
- **Charts:** Recharts (Statistics)
- **Backend:** Next.js Route Handlers (Node runtime) + MongoDB via Mongoose
- **Auth:** `jose` (JWT, HTTP-only cookie) + `bcryptjs` (password hashing)
- **Validation:** Zod
- **State:** React Context (`RestaurantContext`) + localStorage (settings/history) + API polling (orders/menu)

---

## 3. Features

### POS
- **Dine-In** — 12 tables; pick a table, build a cart, **Send to Kitchen**. Table grid shows live status (`Available` / `Preparing…` / `Ready to serve`).
- **Take Away** & **Tea & Snacks** — create orders, track live status.
- **Kitchen** — live board of active orders; mark items **Cook → Ready → Done** (or **Mark all ready**).
- **Counter** — PIN-protected; generate bill, mark paid, clear (archived to history).
- **Statistics** — revenue/orders charts (today/week/month).
- **Expenses** — expense tracking with budget + CSV export.
- **Settings** — editable menu (writes to DB), tax/GST, sounds, counter PIN.
- **Personal Information** — read-only profile backed by MongoDB (with edit).

### Cross-cutting
- **Auth gate:** unauthenticated users only see Login/Signup; everything else needs a session.
- **Kitchen → table notification:** when all items of an order are ready, an app-wide toast + chime fires and the table card turns green.
- **Live sync:** Kitchen/Counter/Dine-In poll the backend every ~4 seconds.

---

## 4. Architecture

```
Browser (Next.js client components)
  │   React Context (RestaurantContext): menu, active orders (polled), settings, auth-pin, history
  │   fetch() ── polling every 4s ──▶
  ▼
Next.js Route Handlers (/api/*)  ── Mongoose ──▶  MongoDB Atlas (spicyocean db)
  - /api/auth/*   users + JWT cookie sessions
  - /api/menu     menu items (auto-seeded)
  - /api/orders   orders (create / list / status / payment / clear)
  - /api/profile  personal information (singleton)
proxy.ts (middleware): gates all pages behind a valid session cookie
```

**Route groups**
- `src/app/(auth)/` → `/login`, `/signup` (no sidebar)
- `src/app/(app)/` → all POS pages (wrapped in the sidebar `AppLayout`, gated)

**Data ownership**
- **MongoDB:** users, profile, menu items, orders.
- **localStorage (per browser):** settings, counter PIN, invoice counter, order history (used by Statistics).

---

## 5. Data models (MongoDB)

**User** (`users`)
- `username` (unique, lowercase), `passwordHash` (bcrypt), timestamps

**Profile** (`profiles`) — singleton (`key: "primary"`)
- `firstName, lastName, email, countryCode, mobile`

**MenuItem** (`menuitems`)
- `name, price, category, kind` (`FOOD` | `TEA_SNACKS`)
- Auto-seeded with 18 food + 12 tea/snacks items on first read.

**Order** (`orders`)
- `orderNo` (e.g. `DIN-AB12CD`), `type` (`DINE_IN`/`TAKE_AWAY`/`TEA_SNACKS`), `tableNumber`
- `items[]`: `{ menuItemId, name, price, category, quantity, status }`
  - item `status`: `added → cooking → ready → completed`
- `paymentStatus` (`pending`/`paid`), `status` (`active`/`cleared`), timestamps

---

## 6. API reference

All API routes run on the Node runtime and are excluded from the auth gate.

### Auth
| Method | Route | Body / Notes |
|---|---|---|
| POST | `/api/auth/signup` | `{ username, password, creationPassword }` → 403 if creation code wrong, 409 if taken |
| POST | `/api/auth/login` | `{ username, password }` → sets HTTP-only session cookie |
| POST | `/api/auth/logout` | clears cookie |
| GET | `/api/auth/me` | current user from cookie |

### Menu
| Method | Route | Notes |
|---|---|---|
| GET | `/api/menu?kind=FOOD\|TEA_SNACKS` | list (auto-seeds on first use) |
| POST | `/api/menu` | `{ name, price, category, kind }` |
| PATCH | `/api/menu/[id]` | `{ name?, price?, category? }` |
| DELETE | `/api/menu/[id]` | remove |

### Orders
| Method | Route | Notes |
|---|---|---|
| GET | `/api/orders?active=1&type=&table=` | list (active by default) |
| POST | `/api/orders` | `{ type, tableNumber?, items[] }` — "Send to Kitchen"; merges into a table's running dine-in order |
| GET | `/api/orders/[id]` | single order (poll a table's status) |
| PATCH | `/api/orders/[id]` | `{ itemStatuses?, allStatus?, itemQuantities?, paymentStatus? }` |
| DELETE | `/api/orders/[id]` | clears (soft) from active lists |

### Profile
| Method | Route | Notes |
|---|---|---|
| GET | `/api/profile` | singleton (seeds defaults first time) |
| PUT | `/api/profile` | upsert |

---

## 7. Project structure

```
src/
  app/
    (auth)/login, (auth)/signup        # auth pages (no sidebar)
    (app)/                             # gated POS pages (sidebar)
      page.tsx (Dine-In), takeaway, tea-snacks, kitchen,
      counter, settings, statistics, expenses, profile
      layout.tsx                        # wraps children in AppLayout
    api/
      auth/{signup,login,logout,me}/route.ts
      menu/route.ts, menu/[id]/route.ts
      orders/route.ts, orders/[id]/route.ts
      profile/route.ts
    layout.tsx, providers.tsx, globals.css, not-found.tsx
  views/                               # page-level UI components
  components/                          # shared + shadcn/ui
  context/RestaurantContext.tsx        # menu + live orders + settings + auth-pin
  lib/{mongodb.ts, auth.ts, utils.ts}
  models/{User,Profile,MenuItem,Order}.ts
  proxy.ts                             # route gating (was middleware.ts)
scripts/seed.mjs                       # test account + sample profile
```

---

## 8. Environment variables (`.env.local`)

```
MONGODB_URI=mongodb+srv://<user>:<urlEncodedPassword>@<cluster>/spicyocean?retryWrites=true&w=majority
AUTH_SECRET=<long random string for signing session JWTs>
SIGNUP_CODE=spicyocean-create        # the "creation password" required to register
```

- `.env.local` is git-ignored (never committed). `.env.example` documents the keys.
- **Password URL-encoding** for the Atlas URI: `!` → `%21`, `@` → `%40` (and any other special chars).

---

## 9. How to run

```bash
npm install            # install dependencies
cp .env.example .env.local   # then fill MONGODB_URI / AUTH_SECRET / SIGNUP_CODE
npm run dev            # http://localhost:8080
```

Other scripts:
```bash
npm run build          # production build (Turbopack)
npm run start          # serve production build (port 8080)
npm run lint           # ESLint (flat config)
npm run seed           # create test account + sample profile in the DB
npm run test           # unit tests (Vitest)
```

### First use
1. Open the app → redirected to **/login**.
2. Go to **Sign up**, create an account using the **creation password** (`SIGNUP_CODE`, currently `spicyocean-create`).
3. Log in. The full app unlocks.

### Test account (from `npm run seed`)
- **Username:** `testadmin`  **Password:** `Test@1234`

### Counter PIN
- Default **`1234`** (change in Settings → Security).

---

## 10. End-to-end ordering flow

1. **Dine-In** → choose a table.
2. Add dishes to the cart → **Send to Kitchen** (creates/merges an order in MongoDB).
3. **Kitchen** sees the order; staff mark items **Ready/Done**.
4. When the whole order is ready → **toast + chime + table turns green** ("inform the table member").
5. **Counter** → Generate Bill → Mark Paid → Clear (moves to history/Statistics).

---

## 11. Notable operational notes

- **Restart dev server after moving/renaming files.** If you see a Tailwind error like `ENOENT … src/app/.../page.tsx`, stop the dev server, delete the `.next` folder, and run `npm run dev` again (stale watcher cache).
- **MongoDB must be reachable.** Atlas: ensure your IP is allowed under **Network Access**; locally, run `mongod`.
- **Security follow-ups:**
  - Rotate the Atlas DB password and the GitHub token that were shared during setup.
  - Change `SIGNUP_CODE` to your own private value.
  - Keep `AUTH_SECRET` secret and stable (changing it invalidates existing sessions).

---

## 12. Git / GitHub

- Repository: `https://github.com/spicyocean2026-SO/spicy-ocean`
- Commits authored by **`spicyocean2026 <spicyocean2026@gmail.com>`** (local repo identity only).
- `.env.local` and secrets are git-ignored.

> Note: the backend ordering flow, auth, profile, Atlas switch, and seed script were the most recent changes and may not yet be pushed — commit & push when ready.

---

_Generated as a project handover document._
