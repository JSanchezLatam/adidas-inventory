import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/types'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  setAuth: (user: User | null, session: Session | null, role: UserRole | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      role: null,
      setAuth: (user, session, role) => set({ user, session, role }),
      clearAuth: () => set({ user: null, session: null, role: null }),
    }),
    {
      name: 'adidas-auth',
      partialize: (state) => ({ role: state.role }),
    }
  )
)
