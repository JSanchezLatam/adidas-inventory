import { createClient } from './server'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return null
  const role = user.app_metadata?.role
  return role === 'admin' || role === 'superadmin' ? user : null
}

export async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) return null
  return user.app_metadata?.role === 'superadmin' ? user : null
}
