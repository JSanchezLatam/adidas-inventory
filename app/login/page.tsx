'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/lib/supabase/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.user || !data.session) {
      setError('Credenciales incorrectas')
      setLoading(false)
      return
    }

    // Role is embedded in the JWT app_metadata — no extra API call needed
    const role = (data.user.app_metadata?.role as UserRole) ?? 'staff'

    setAuth(data.user, data.session, role)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-white text-3xl font-black tracking-tighter">adidas</p>
          <p className="text-gray-400 text-sm mt-1">Sistema de Inventario — Bodega</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Correo electronico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl bg-gray-800 text-white placeholder:text-gray-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="usuario@adidas.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl bg-gray-800 text-white placeholder:text-gray-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full mt-2 bg-white text-black hover:bg-gray-100"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
