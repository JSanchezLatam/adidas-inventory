'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Shelf } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function ShelvesAdminPage() {
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    fetch('/api/shelves')
      .then((r) => r.json())
      .then((data) => {
        setShelves(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Group by zone
  const zones = Array.from(new Set(shelves.map((s) => s.zone ?? 'General')))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Anaqueles</h1>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-white bg-white/20 px-3 py-2 rounded-lg"
          >
            + Nuevo
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-1">{shelves.length} anaquel{shelves.length !== 1 ? 'es' : ''} registrados</p>
      </header>

      <main className="px-4 py-4 flex flex-col gap-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{zone}</p>
              <div className="grid grid-cols-3 gap-2">
                {shelves
                  .filter((s) => (s.zone ?? 'General') === zone)
                  .map((shelf) => (
                    <div key={shelf.id} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                      <p className="font-bold text-gray-900">{shelf.code}</p>
                      {shelf.label && <p className="text-xs text-gray-400 mt-1 leading-tight">{shelf.label}</p>}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </main>

      {showForm && (
        <AddShelfModal
          onClose={() => setShowForm(false)}
          onSaved={(s) => {
            setShelves((prev) => [...prev, s].sort((a, b) => a.code.localeCompare(b.code)))
            setShowForm(false)
            showToast('Anaquel creado', 'success')
          }}
        />
      )}
    </div>
  )
}

function AddShelfModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (s: Shelf) => void
}) {
  const [form, setForm] = useState({ code: '', label: '', zone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) {
      setError('El codigo es obligatorio')
      return
    }
    setSaving(true)
    const res = await fetch('/api/shelves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        label: form.label.trim() || null,
        zone: form.zone.trim() || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      onSaved(data)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Nuevo anaquel</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Codigo *"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="A1"
          />
          <Input
            label="Etiqueta"
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Anaquel A1 — Entrada"
          />
          <Input
            label="Zona"
            value={form.zone}
            onChange={(e) => set('zone', e.target.value)}
            placeholder="Running, Futbol, Casual..."
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" size="lg" loading={saving} className="w-full mt-2">
            Guardar
          </Button>
        </form>
      </div>
    </div>
  )
}
