import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  name: string | null
  setAuth: (user: User | null, session: Session | null, role: UserRole | null) => void
  clearAuth: () => void
}

// Read persisted fields synchronously from localStorage to prevent flicker
function getPersistedData(): { role: UserRole | null; name: string | null } {
  if (typeof window === 'undefined') return { role: null, name: null }
  try {
    const raw = localStorage.getItem('adidas-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        role: parsed?.state?.role ?? null,
        name: parsed?.state?.name ?? null,
      }
    }
  } catch {}
  return { role: null, name: null }
}

const { role: persistedRole, name: persistedName } = getPersistedData()

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      role: persistedRole,
      name: persistedName,
      setAuth: (user, session, role) => set({
        user,
        session,
        role,
        name: user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? null,
      }),
      clearAuth: () => set({ user: null, session: null, role: null, name: null }),
    }),
    {
      name: 'adidas-auth',
      partialize: (state) => ({ role: state.role, name: state.name }),
    }
  )
)
