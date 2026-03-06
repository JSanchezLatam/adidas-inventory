'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (role === null) return
    if (role === 'staff') router.replace('/')
  }, [role, router])

  if (role === 'staff' || role === null) return null

  return <>{children}</>
}
