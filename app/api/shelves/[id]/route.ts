import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: shelf, error: shelfError } = await supabase
    .from('shelves')
    .select('*')
    .eq('id', id)
    .single()

  if (shelfError || !shelf) {
    return NextResponse.json({ error: 'Anaquel no encontrado' }, { status: 404 })
  }

  const { data: locations, error: locError } = await supabase
    .from('product_locations')
    .select('*, product:products(*)')
    .eq('shelf_id', id)
    .order('level')

  if (locError) {
    return NextResponse.json({ error: locError.message }, { status: 500 })
  }

  return NextResponse.json({ shelf, locations: locations ?? [] })
}
