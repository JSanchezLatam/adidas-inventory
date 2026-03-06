# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (PWA disabled in development)
npm run build     # Production build
npm run lint      # ESLint via Next.js
```

No test suite is configured.

## Architecture

**Next.js 14 App Router PWA** for warehouse inventory management at an Adidas store. Mobile-first, designed to be installed as a PWA on phones used by warehouse staff.

### Data flow

- All DB access goes through **Supabase** (PostgreSQL + auth).
- Client components call **Next.js API routes** (`app/api/`) which use the **server-side Supabase client** (`lib/supabase/server.ts`) with the service role key for privileged operations.
- The **browser client** (`lib/supabase/client.ts`) is used only for auth (`signIn`, `signOut`).
- Search results are cached by **TanStack Query** with `offlineFirst` network mode (5 min stale, 30 min in-memory) to support offline use.

### Auth & roles

- Auth state lives in **Zustand** (`store/auth.store.ts`), persisted to localStorage (only `role` is persisted).
- Two roles: `staff` (read-only) and `admin` (can assign locations, manage shelves/products).
- Admin-only UI sections are gated client-side via `role === 'admin'` from the store.
- Row Level Security (RLS) is enforced at the database level — see `supabase/schema.sql`.

### Key data model

```
products  ──(1:1)──  product_locations  ──(N:1)──  shelves
```

Each product has at most one location: a shelf + level (`bajo` / `medio` / `alto`) + quantity.

### Barcode resolution

`lib/barcode-resolver.ts` — resolves a scanned code by trying `barcode` → `sku` → `reference` in sequence. Used by `app/api/products/resolve/[code]/route.ts`.

### Pages & routes

| Route | Purpose |
|-------|---------|
| `/` | Search + barcode scanner (staff default view) |
| `/login` | Supabase email/password auth |
| `/product/[id]` | Product detail + location |
| `/admin` | Admin menu (role-gated sections) |
| `/admin/products` | List, add, CSV import |
| `/admin/shelves` | Manage shelves |
| `/admin/assign` | Assign product to shelf/level |

### Database setup

Run in order in the Supabase SQL editor:
1. `supabase/schema.sql` — creates all tables, indexes, triggers, RLS policies
2. `supabase/seed.sql` — initial shelves and sample products

After seeding, promote a user to admin:
```sql
update public.user_profiles set role = 'admin', name = 'Name' where username = 'email@example.com';
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # used only in API routes server-side
```

### PWA

`next-pwa` wraps the Next.js config. PWA is disabled in `development` mode. Service worker and workbox files are pre-generated in `public/`.
