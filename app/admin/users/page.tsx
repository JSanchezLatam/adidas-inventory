'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { UserGreeting } from '@/components/ui/UserGreeting'
import { UserCardSkeleton } from '@/components/ui/Skeleton'
import type { UserRole } from '@/lib/supabase/types'

interface UserRow {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

const ROLE_LABEL: Record<UserRole, string> = {
  staff: 'Staff',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

const ROLE_STYLE: Record<UserRole, string> = {
  staff: 'bg-gray-100 text-gray-600',
  admin: 'bg-black text-white',
  superadmin: 'bg-yellow-400 text-black',
}

export default function UsersAdminPage() {
  const { role: myRole, user: me } = useAuthStore()
  const isSuperAdmin = myRole === 'superadmin'
  const router = useRouter()
  const { showToast } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showResetModal, setShowResetModal] = useState<UserRow | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleRoleChange(user: UserRow, newRole: UserRole) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u))
      showToast(`Rol actualizado a ${newRole}`, 'success')
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Error al actualizar rol', 'error')
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`¿Eliminar a ${user.name || user.email}? Esta acción no se puede deshacer.`)) return
    setDeletingId(user.id)
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      showToast('Usuario eliminado', 'success')
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Error al eliminar', 'error')
    }
  }

  // Roles that the current user can assign
  function assignableRoles(): UserRole[] {
    if (isSuperAdmin) return ['staff', 'admin', 'superadmin']
    return ['staff', 'admin']
  }

  // Whether current user can edit a target user
  function canEdit(target: UserRow) {
    if (target.id === me?.id) return false // can't change own role here
    if (isSuperAdmin) return true
    return target.role !== 'superadmin' // admin cannot edit superadmins
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <UserGreeting />
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Usuarios</h1>
          <button onClick={() => setShowCreate(true)} className="text-xs text-white bg-white/20 px-3 py-2 rounded-lg">
            + Nuevo
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-1">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
      </header>

      <main className="px-4 py-4 flex flex-col gap-3 pb-32">
        {/* My account */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Mi cuenta</p>
          <p className="text-xs text-gray-400 mb-3">{me?.email}</p>
          <button onClick={() => setShowPasswordModal(true)} className="text-sm text-blue-600 font-medium">
            Cambiar mi contraseña
          </button>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mt-2">
          Todos los usuarios
        </p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{user.name || user.email}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Desde {new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${ROLE_STYLE[user.role]}`}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>

              {/* Role selector */}
              {canEdit(user) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Rol</p>
                  <div className="flex gap-2 flex-wrap">
                    {assignableRoles().map((r) => (
                      <button
                        key={r}
                        onClick={() => user.role !== r && handleRoleChange(user, r)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          user.role === r
                            ? ROLE_STYLE[r] + ' border-transparent'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-3">
                    <button
                      onClick={() => setShowResetModal(user)}
                      className="text-xs text-orange-600 font-medium"
                    >
                      Resetear contraseña
                    </button>
                    {isSuperAdmin && user.id !== me?.id && (
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        className="text-xs text-red-600 font-medium disabled:opacity-50"
                      >
                        {deletingId === user.id ? 'Eliminando...' : 'Eliminar usuario'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {showCreate && (
        <CreateUserModal
          myRole={myRole ?? 'admin'}
          onClose={() => setShowCreate(false)}
          onSaved={(u) => { setUsers((prev) => [u, ...prev]); setShowCreate(false); showToast('Usuario creado', 'success') }}
        />
      )}

      {showResetModal && (
        <ResetPasswordModal
          user={showResetModal}
          onClose={() => setShowResetModal(null)}
          onDone={() => { setShowResetModal(null); showToast('Contraseña actualizada', 'success') }}
        />
      )}

      {showPasswordModal && (
        <ChangeOwnPasswordModal
          onClose={() => setShowPasswordModal(false)}
          onDone={() => { setShowPasswordModal(false); showToast('Contraseña actualizada', 'success') }}
        />
      )}
    </div>
  )
}

// ── Create User Modal ─────────────────────────────────────────
function CreateUserModal({ myRole, onClose, onSaved }: {
  myRole: UserRole
  onClose: () => void
  onSaved: (u: UserRow) => void
}) {
  const availableRoles: UserRole[] = myRole === 'superadmin'
    ? ['staff', 'admin', 'superadmin']
    : ['staff', 'admin']

  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'staff' as UserRole })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email y contraseña son obligatorios'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSaved({ id: data.id, email: form.email, name: form.name || form.email, role: form.role, created_at: new Date().toISOString() })
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al crear usuario')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Nuevo usuario</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan Perez" />
          <Input label="Correo electronico *" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@adidas.com" />
          <Input label="Contraseña *" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimo 6 caracteres" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <div className="flex gap-2 flex-wrap">
              {availableRoles.map((r) => (
                <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    form.role === r ? ROLE_STYLE[r] + ' border-transparent' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" size="lg" loading={saving} className="w-full mt-2">Crear usuario</Button>
        </form>
      </div>
    </div>
  )
}

// ── Reset Password Modal ──────────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone }: { user: UserRow; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Minimo 6 caracteres'); return }
    setSaving(true)
    const res = await fetch(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSaving(false)
    res.ok ? onDone() : setError((await res.json()).error ?? 'Error')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Resetear contraseña</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-5">{user.name || user.email}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" size="lg" loading={saving} className="w-full mt-2">Guardar contraseña</Button>
        </form>
      </div>
    </div>
  )
}

// ── Change Own Password Modal ─────────────────────────────────
function ChangeOwnPasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Minimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setSaving(true)
    const res = await fetch('/api/auth/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSaving(false)
    res.ok ? onDone() : setError((await res.json()).error ?? 'Error')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Cambiar mi contraseña</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" />
          <Input label="Confirmar contraseña" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" size="lg" loading={saving} className="w-full mt-2">Guardar contraseña</Button>
        </form>
      </div>
    </div>
  )
}
