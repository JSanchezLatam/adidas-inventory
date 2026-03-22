# AGENTS.md - Agent Coding Guidelines

This file provides guidance for agentic coding agents working in this repository.

## About the Project

**Bodega Adidas — Sistema de Inventario**

A Spanish-language PWA for tracking product locations in a warehouse. Users scan barcodes or search for products to find which shelf and level they're stored on. Features include barcode scanning via camera, product search, shelf management, and CSV import. The app is designed for warehouse workers using mobile devices.

## Project Overview

- **Framework**: Next.js 14 App Router with PWA support
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config)
- **State Management**: Zustand with localStorage persistence
- **Database**: Supabase (PostgreSQL + auth)
- **Barcode Scanning**: @zxing/browser via camera
- **Data Fetching**: TanStack Query for offline cache

## Commands

```bash
npm run dev       # Start dev server (PWA disabled)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint via Next.js
```

**Note**: No test suite configured. Do not add tests unless explicitly requested.

## Code Style Guidelines

### General Principles
- Write concise, functional code without unnecessary comments
- Prefer explicit over implicit
- Keep functions small and focused
- Use early returns to reduce nesting

### TypeScript

Use `interface` for object shapes and state types, `type` for unions/literals. Export shared types from `@/lib/supabase/types.ts`. Use explicit return types for API routes and utilities.

```typescript
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface AuthState {
  user: User | null
  role: UserRole | null
  setAuth: (user: User, role: UserRole) => void
}
```

### Imports

Use `@/` alias for internal imports. Order: external libs → internal packages → components/hooks/stores.

```typescript
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { ProductCard } from '@/components/Product/ProductCard'
```

### Components

Add `'use client'` for components using hooks or browser APIs. Use `forwardRef` with `displayName` for ref forwarding. Define props interfaces above the component, use `extends` for HTML element props.

```typescript
'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => (
    <button ref={ref} className={cn('base', variantClasses[variant], className)} {...props}>
      {children}
    </button>
  )
)
Button.displayName = 'Button'
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard`, `ScannerModal` |
| Functions/variables | camelCase | `handleScan`, `productList` |
| Types/interfaces | PascalCase | `AuthState`, `ShelfLevel` |
| File names | kebab-case | `auth.store.ts` |
| Directories | kebab-case | `components/ui`, `app/api` |

### CSS / Tailwind

Use Tailwind utility classes exclusively. Use `cn()` from `@/lib/utils` to merge classes. Mobile-first: design for mobile first, add tablet/desktop with `md:`, `lg:` prefixes.

### API Routes

Use `NextRequest` and `NextResponse` from `next/server`. Return JSON with `{ error: string }`. Use appropriate HTTP status codes (200, 201, 403, 404, 500). Use Spanish error messages.

```typescript
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const supabase = createAdminClient()
  const body = await request.json()
  const { data, error } = await supabase.from('products').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
```

### State Management (Zustand)

Use `create<T>()` with explicit type. Use `persist` middleware with `partialize`. Handle SSR by reading persisted data synchronously from localStorage.

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user, role) => set({ user, role }),
      clearAuth: () => set({ user: null, role: null }),
    }),
    { name: 'auth-storage', partialize: (state) => ({ role: state.role }) }
  )
)
```

### Database Access

Use `createAdminClient()` from `@/lib/supabase/server` for server-side privileged ops. Use `createClient()` from `@/lib/supabase/client` for client-side auth only. Never expose service role key on client.

### File Organization

```
app/                    # Next.js App Router pages
  api/                  # API routes
  admin/                # Admin pages (role-gated)
components/             # React components (ui/, Product/, Shelf/, Scanner/)
lib/                    # Utilities (supabase/, utils.ts)
store/                  # Zustand stores
hooks/                  # Custom React hooks
```

### PWA & ESLint

- PWA configured in `next.config.mjs` using `@ducanh2912/next-pwa` (disabled in dev)
- ESLint: `next/core-web-vitals` + `next/typescript`
- Run `npm run lint` to check issues

### Common Patterns

- **Loading**: Use skeleton components
- **Errors**: Display Spanish user-friendly messages, use toast notifications
- **Auth**: Use `useAuthStore` for client checks, `requireAdmin()` for API routes, gate admin UI with `role === 'admin'`
- **Barcode resolution**: Resolve in order barcode → SKU → reference, log to `scan_logs`

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # Server-side only
```

Never commit secrets or environment files.
