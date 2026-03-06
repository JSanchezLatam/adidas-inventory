import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, location:product_locations(*, shelf:shelves(*))')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { location, ...product } = data as any
  return NextResponse.json({
    ...product,
    location: Array.isArray(location) && location.length > 0 ? location[0] : null,
  })
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single() as any
  return profile?.role === 'admin' ? user : null
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createServiceClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase
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
  const supabase = await createServiceClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
