'use client'

import { useAuthStore } from '@/store/auth.store'

const ROLE_LABEL: Record<string, string> = {
  staff: 'Staff',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

export function UserGreeting() {
  const { name, role } = useAuthStore()

  return (
    <div className="flex items-center justify-between" suppressHydrationWarning>
      <div>
        <p className="text-white text-sm font-semibold leading-tight">{name ?? '—'}</p>
        <p className="text-gray-400 text-xs mt-0.5">{role ? ROLE_LABEL[role] : ''}</p>
      </div>
    </div>
  )
}
