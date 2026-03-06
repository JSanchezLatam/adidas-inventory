import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const { scanned_value, resolved_product_id, action } = body

  await supabase.from('scan_logs').insert({
    user_id: user?.id ?? null,
    scanned_value,
    resolved_product_id: resolved_product_id ?? null,
    action: action ?? 'lookup',
  } as Record<string, unknown>)

  return NextResponse.json({ ok: true })
}
