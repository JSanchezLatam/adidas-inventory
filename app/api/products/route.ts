import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single() as any
  return (profile?.role === 'admin' || profile?.role === 'superadmin') ? user : null
}

export async function POST(request: NextRequest) {
  const supabase = await createAdminClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { sku, barcode } = body

  // Check for existing product with same SKU or barcode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dupQuery = (supabase as any).from('products').select('*')
  if (barcode) {
    dupQuery = dupQuery.or(`sku.eq.${sku},barcode.eq.${barcode}`)
  } else {
    dupQuery = dupQuery.eq('sku', sku)
  }
  const { data: existing } = await dupQuery.maybeSingle()

  if (existing) {
    if (existing.status === 'inactive') {
      return NextResponse.json(
        { error: 'inactive', product: existing },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'El producto ya existe en el sistema' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase.from('products').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
