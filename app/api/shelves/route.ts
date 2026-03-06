import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('shelves').select('*').order('code')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const service = createAdminClient()
  const { data, error } = await service.from('shelves').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const superadmin = await requireSuperAdmin()
  if (!superadmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await request.json()
  const service = createAdminClient()
  const { error } = await service.from('shelves').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
