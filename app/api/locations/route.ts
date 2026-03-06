import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth-helpers'

export async function DELETE(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const productId = request.nextUrl.searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id requerido' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('product_locations').delete().eq('product_id', productId)
  await supabase.from('products')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', productId)

  return NextResponse.json({ ok: true })
}

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
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { product_id, shelf_id, level, quantity, notes } = body

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
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
