# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js on localhost:3000)
npm run build     # Production build
npm run lint      # Run ESLint
```

QR code generation (requires `pip install qrcode[pil]`):
```bash
DOMAIN=https://yourdomain.com python scripts/generate_qr.py
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
ADMIN_COOKIE_SECRET=
```

## Architecture

This is a **Next.js 16 + Supabase** multi-tenant redemption tracking system. There are two user-facing surfaces:

- **`/redeem?store_id=<uuid>`** — Public customer form. Submits name/email/phone tied to a store. Enforces a unique constraint on email+phone at the DB level (Postgres error `23505`).
- **`/admin`** — Password-protected dashboard. Shows real-time redemption stats across all stores via Supabase Realtime (`postgres_changes` on `INSERT`).

### Auth Flow

Admin auth is cookie-based with no third-party auth library:
1. `POST /api/admin/login` validates `ADMIN_PASSWORD`, signs a cookie using HMAC-SHA256 (Web Crypto API) with `ADMIN_COOKIE_SECRET`, and sets an `httpOnly` cookie.
2. `proxy.ts` exports a `proxy()` function (acting as middleware) that verifies the signed cookie on every `/admin/*` and `/api/admin/*` request. Unauthenticated page requests redirect to `/admin/login`; unauthenticated API requests return 401.
3. `lib/auth.ts` contains `signCookieValue` / `verifyCookieValue` — these use timing-safe comparison and are compatible with both Edge Runtime and Node.js.

> **Note:** `proxy.ts` at the root is the middleware file but is named `proxy.ts` rather than `middleware.ts`. If Next.js middleware isn't being picked up, this is why.

### Supabase Client Split

- `lib/supabase.ts` — anon client (uses `NEXT_PUBLIC_*` keys), safe for browser. Used in `app/admin/page.tsx` for reads and Realtime subscriptions.
- `lib/supabase-server.ts` — service role client (`SUPABASE_SERVICE_ROLE_KEY`), bypasses RLS. Used **only** in API routes (`app/api/**`). Never import this in client components.

### Database Schema

Two tables:
- `stores` — `id` (uuid), `name`, `slug`, `location`
- `redemptions` — `id`, `store_id` (FK), `name`, `email`, `phone`, `created_at`. Has a unique constraint on `(email, phone)` to prevent duplicate redemptions.

### Rate Limiting

Both `/api/redeem` and `/api/admin/login` use an in-memory `Map`-based rate limiter (resets on server restart). Redeem: 3 submissions / 10 min per IP. Login: 5 attempts / 15 min per IP.

### Path Aliases

`@/*` maps to the project root (e.g., `@/lib/auth` resolves to `./lib/auth.ts`).
