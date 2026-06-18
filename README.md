# Spicy Ocean

Restaurant point-of-sale (POS) dashboard for **Spicy Ocean** — _Biggest Open Kitchen on Beach Road_.

Built with **Next.js 16 (App Router)** and **React 19**. The POS runs entirely in the browser (state persisted to `localStorage`), and a small **MongoDB** backend powers the Personal Information profile.

## Features

- **Dine-In** — table-by-table ordering across 12 tables
- **Take Away** & **Tea & Snacks** — ticketed orders with auto-generated IDs
- **Kitchen** — live view of active orders with cooking/ready status + printable tickets
- **Counter** — PIN-protected billing, payments, and printable invoices
- **Statistics** — revenue/orders charts (today / week / month) via Recharts
- **Expenses** — expense tracking with budget and CSV export
- **Settings** — editable menu, tax/GST, notification sounds, PIN management
- **Personal Information** — read-only profile backed by MongoDB (with edit/save)
- Daily auto-reset of active orders at midnight; notification sounds via Web Audio

## Tech stack

| Area     | Choice                                            |
| -------- | ------------------------------------------------- |
| Framework| Next.js 16 (App Router, Turbopack), React 19, TS  |
| Styling  | Tailwind CSS, shadcn/ui (Radix), Framer Motion    |
| Data viz | Recharts                                          |
| Backend  | Next.js Route Handlers + MongoDB (Mongoose)       |
| State    | React Context + `localStorage` (POS data)         |

## Getting started

### Prerequisites

- Node.js 20.9+
- A running MongoDB instance (local or hosted) for the Personal Information feature

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local and set MONGODB_URI

# 3. Run the dev server (http://localhost:8080)
npm run dev
```

### Environment variables

| Variable      | Description                                | Example                                |
| ------------- | ------------------------------------------ | -------------------------------------- |
| `MONGODB_URI` | MongoDB connection string for the backend  | `mongodb://127.0.0.1:27017/spicyocean` |

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server on port 8080    |
| `npm run build`  | Production build                     |
| `npm run start`  | Serve the production build on 8080   |
| `npm run lint`   | Lint with ESLint (flat config)       |
| `npm run test`   | Run unit tests (Vitest)              |

## API

| Method | Route          | Description                                                  |
| ------ | -------------- | ------------------------------------------------------------ |
| `GET`  | `/api/profile` | Returns the singleton profile (seeds defaults on first use)  |
| `PUT`  | `/api/profile` | Validates (Zod) and upserts the profile                      |

## Project structure

```
src/
  app/                # Next.js App Router
    api/profile/      # Profile API route handlers
    <route>/page.tsx  # Thin route wrappers around views
    layout.tsx        # Root layout + metadata
    providers.tsx     # Client providers (Query, Tooltip, Sonner, Restaurant) + mount gate
    globals.css       # Tailwind + design tokens
  views/              # Page-level UI (Dine-In, Counter, Statistics, Personal Info, ...)
  components/         # Shared components + shadcn/ui primitives
  context/            # RestaurantContext (POS domain state)
  lib/mongodb.ts      # Cached Mongoose connection
  models/Profile.ts   # Mongoose Profile model
  hooks/              # Custom hooks
```

## Notes

- POS domain data (menu, orders, expenses, settings) lives in the browser via `localStorage`; the MongoDB backend currently powers the Personal Information profile only.
- `MONGODB_URI` and other secrets belong in `.env.local`, which is git-ignored.
