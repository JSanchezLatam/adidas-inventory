import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Accept token via Authorization header (for post-login calls before cookie sync)
  // or fall back to cookie-based session
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const supabase = await createClient()

  let userId: string | null = null

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    userId = user?.id ?? null
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = await createAdminClient()
  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return NextResponse.json({ role: profile?.role ?? 'staff' })
}
