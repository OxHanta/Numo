# Numo — Stock & Crypto Intelligence App

## Overview

Numo is a personal finance cockpit for retail investors and active traders. It lets users track portfolios, monitor watchlists, set price alerts, and read curated market news — all in a fast, dark-mode-first interface.

## Architecture

**Monorepo structure** (pnpm workspaces):

```
artifacts/
  api-server/    — Express REST API (port from $PORT env)
  numo/          — React + Vite frontend (port from $PORT env)
lib/
  api-spec/      — OpenAPI spec + Orval codegen config
  api-client-react/ — Generated TanStack Query hooks
  api-zod/       — Generated Zod validation schemas
  db/            — Drizzle ORM schema + migrations
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, wouter, framer-motion
- **Backend**: Express, TypeScript, Drizzle ORM, PostgreSQL
- **Auth**: Clerk (dev key: pk_test_... / production proxy at /api/__clerk)
- **Charts**: TradingView Lightweight Charts v5
- **Market Data**: Polygon.io REST API (15-min delayed, free tier)
- **News**: Finnhub API
- **API contract**: OpenAPI spec → Orval codegen (React Query hooks + Zod schemas)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Public landing page (redirects signed-in users to /dashboard) |
| `/sign-in/*?` | Clerk sign-in (branded, dark) |
| `/sign-up/*?` | Clerk sign-up (branded, dark) |
| `/dashboard` | Portfolio summary, watchlist movers, recent news |
| `/watchlist` | Add/remove assets with live prices |
| `/portfolio` | Positions with unrealised P&L |
| `/alerts` | Price target alerts + alert history |
| `/assets/:ticker` | Asset detail: candlestick chart, quote, news |
| `/news` | Dual tab: My Feed (watchlist) + Market news |

## API Routes (all under /api)

- `GET /api/healthz`
- `GET/POST/DELETE /api/watchlist`, `GET /api/watchlist/movers`
- `GET/POST /api/portfolio/summary`, `GET/POST/PUT/DELETE /api/portfolio/positions`
- `GET/POST/DELETE/PATCH /api/alerts`, `GET /api/alerts/history`
- `GET /api/market/search`, `GET /api/market/quote/:ticker`, `GET /api/market/chart/:ticker`
- `GET /api/news`, `GET /api/news/market`

## Database Schema

Tables (PostgreSQL via Drizzle):
- `watchlist_items` — user watchlist entries
- `portfolio_positions` — manual portfolio positions with isClosed flag
- `alerts` — price target alerts (price_above | price_below | pct_change)
- `alert_history` — alert trigger log

## Environment Variables / Secrets

| Name | Where | Purpose |
|------|-------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | env var | Clerk frontend key |
| `CLERK_SECRET_KEY` | secret | Clerk server key |
| `CLERK_PUBLISHABLE_KEY` | secret | Clerk server publishable key |
| `POLYGON_API_KEY` | secret | Polygon.io market data |
| `FINNHUB_API_KEY` | secret | Finnhub news |
| `DATABASE_URL` | secret | PostgreSQL connection |
| `SESSION_SECRET` | secret | Express session |

## Codegen

Run after editing `lib/api-spec/openapi.yaml`:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## DB Schema Push

```bash
pnpm --filter @workspace/db run push
```

## Key Design Decisions

- **Free-tier first**: Polygon.io free tier gives 15-min delayed data. No real-time websockets.
- **Clerk proxy**: Production deployment uses `/api/__clerk` as the Clerk FAPI proxy (configured automatically in app.ts). Dev uses Clerk CDN directly.
- **No AI/sentiment**: Deliberately cut from MVP scope.
- **Alert delivery**: Alert infrastructure is in the DB but email delivery (Nodemailer) is not yet wired — future work.
- **Lightweight Charts v5**: Uses `chart.addSeries(CandlestickSeries, opts)` API (not the old `addCandlestickSeries`).
