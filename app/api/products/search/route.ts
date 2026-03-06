import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, location:product_locations(*, shelf:shelves(*))')
    .or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,reference.ilike.%${q}%,barcode.eq.${q}`
    )
    .order('name')
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten location (one-to-one)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (data ?? []).map((p: any) => {
    const { location, ...product } = p
    return {
      ...product,
      location: Array.isArray(location) && location.length > 0 ? location[0] : null,
    }
  })

  return NextResponse.json(results)
}
