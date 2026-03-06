'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/lib/supabase/types'

function AuthProvider({ children }: { children: ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Rehydrate on mount (page refresh) — role comes from JWT app_metadata
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const role = (session.user.app_metadata?.role as UserRole) ?? 'staff'
        setAuth(session.user, session, role)
      } else {
        clearAuth()
      }
    })

    // Stay in sync with auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
      } else if (session?.user) {
        const role = (session.user.app_metadata?.role as UserRole) ?? 'staff'
        setAuth(session.user, session, role)
      }
    })

    return () => subscription.unsubscribe()
  }, [setAuth, clearAuth])

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            networkMode: 'offlineFirst',
          },
          mutations: {
            networkMode: 'offlineFirst',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
