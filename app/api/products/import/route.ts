import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseProductsCSV } from '@/lib/csv-parser'

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single() as any
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 })

  const text = await file.text()
  const { products, errors } = parseProductsCSV(text)

  if (errors.length > 0 && products.length === 0) {
    return NextResponse.json({ error: 'CSV invalido', details: errors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'sku' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    imported: Array.isArray(data) ? data.length : 0,
    warnings: errors,
  })
}
