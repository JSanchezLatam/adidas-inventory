import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/supabase/auth-helpers'

type Params = Promise<{ id: string }>

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('products')
    .select('*, location:product_locations(*, shelf:shelves(*))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { location, ...product } = data as any
  // PostgREST returns a single object (not array) for one-to-one FK (unique constraint)
  const loc = Array.isArray(location) ? (location[0] ?? null) : (location ?? null)
  return NextResponse.json({ ...product, location: loc })
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const service = createAdminClient()
  const { data, error } = await service
    .from('products')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const superadmin = await requireSuperAdmin()
  if (!superadmin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const service = createAdminClient()
  const { error } = await service.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
