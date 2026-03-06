import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  const supabase = createAdminClient()

  let query = supabase
    .from('products')
    .select('*, location:product_locations(*, shelf:shelves(*))')
    .order('name')
    .limit(100)

  if (q && q.length >= 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = (query as any).or(`name.ilike.%${q}%,sku.ilike.%${q}%,reference.ilike.%${q}%,barcode.eq.${q}`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten location (one-to-one)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (data ?? []).map((p: any) => {
    const { location, ...product } = p
    // PostgREST returns a single object (not array) for one-to-one FK (unique constraint)
    const loc = Array.isArray(location) ? (location[0] ?? null) : (location ?? null)
    return { ...product, location: loc }
  })

  return NextResponse.json(results)
}
