import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth-helpers'

// GET /api/users — list all users with their profiles
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createAdminClient()
  const { data: authUsers, error: authError } = await service.auth.admin.listUsers()
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: profiles } = await service
    .from('user_profiles')
    .select('id, name, role, username')

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const users = authUsers.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    name: profileMap[u.id]?.name ?? '',
    role: profileMap[u.id]?.role ?? 'staff',
    username: profileMap[u.id]?.username ?? u.email,
  }))

  return NextResponse.json(users)
}

// POST /api/users — create a new user
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, name, role } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
  }

  // Only superadmin can create superadmin users
  if (role === 'superadmin' && admin.app_metadata?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Sin permisos para asignar este rol' }, { status: 403 })
  }

  const service = createAdminClient()
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || email },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data.user) {
    await service
      .from('user_profiles')
      .update({ role: role || 'staff', name: name || email })
      .eq('id', data.user.id)
  }

  return NextResponse.json({ id: data.user?.id })
}
