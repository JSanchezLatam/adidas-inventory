import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/auth-helpers'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const supabase = createAdminClient()
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
