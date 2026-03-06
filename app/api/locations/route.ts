import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_locations')
    .select('*, shelf:shelves(*), product:products(*)')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single() as any
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { product_id, shelf_id, level, quantity, notes } = body

  const { data, error } = await supabase
    .from('product_locations')
    .upsert(
      {
        product_id,
        shelf_id,
        level,
        quantity: quantity ?? 0,
        notes: notes ?? null,
        assigned_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'product_id' }
    )
    .select('*, shelf:shelves(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
