import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth-helpers'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { password } = await req.json()
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  // Admin cannot reset superadmin passwords
  if (admin.app_metadata?.role === 'admin') {
    const service = createAdminClient()
    const { data: target } = await service.from('user_profiles').select('role').eq('id', id).single()
    if (target?.role === 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
  }

  const service = createAdminClient()
  const { error } = await service.auth.admin.updateUserById(id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
