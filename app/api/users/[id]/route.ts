import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/supabase/auth-helpers'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/users/[id] — update role or name
export async function PATCH(req: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const service = createAdminClient()

  // Check target user's current role
  const { data: target } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', id)
    .single()

  const myRole = admin.app_metadata?.role
  const targetRole = target?.role

  // Admin cannot edit superadmins or assign superadmin role
  if (myRole === 'admin') {
    if (targetRole === 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos para editar superadmin' }, { status: 403 })
    }
    if (body.role === 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos para asignar este rol' }, { status: 403 })
    }
  }

  const updates: Record<string, string> = {}
  if (body.role) updates.role = body.role
  if (body.name !== undefined) updates.name = body.name

  const { error } = await service.from('user_profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/users/[id] — superadmin only
export async function DELETE(_req: Request, { params }: Params) {
  const superadmin = await requireSuperAdmin()
  if (!superadmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Cannot delete yourself
  if (id === superadmin.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
  }

  const service = createAdminClient()
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
