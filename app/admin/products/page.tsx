'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const router = useRouter()

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      (p.reference ?? '').toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    fetch('/api/products/search?q=a')
      .then((r) => r.json())
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/products/import', { method: 'POST', body: formData })
    const data = await res.json()
    setImporting(false)

    if (res.ok) {
      showToast(`${data.imported} productos importados`, 'success')
      // Reload
      fetch('/api/products/search?q=a').then((r) => r.json()).then(setProducts)
    } else {
      showToast(data.error ?? 'Error al importar', 'error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

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
          <h1 className="text-white text-xl font-bold">Productos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-3 py-2 rounded-lg"
              disabled={importing}
            >
              {importing ? '...' : '↑ CSV'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-white bg-white/20 px-3 py-2 rounded-lg"
            >
              + Nuevo
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImport}
        />
        <div className="mt-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-xl bg-gray-800 text-white placeholder:text-gray-500 px-4 py-3 text-sm focus:outline-none"
          />
        </div>
      </header>

      <main className="px-4 py-4 flex flex-col gap-2 pb-24">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 active:bg-gray-50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{p.sku} {p.size ? `· T${p.size}` : ''}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))
        )}
      </main>

      {/* Add product modal */}
      {showForm && (
        <AddProductModal
          onClose={() => setShowForm(false)}
          onSaved={(p) => {
            setProducts((prev) => [p, ...prev])
            setShowForm(false)
            showToast('Producto creado', 'success')
          }}
        />
      )}
    </div>
  )
}

function AddProductModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const [form, setForm] = useState({ sku: '', name: '', barcode: '', reference: '', size: '', color: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sku || !form.name) {
      setError('SKU y nombre son obligatorios')
      return
    }
    setSaving(true)
    const body = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || null])
    )
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Nuevo producto</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="SKU *" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="HQ8707" />
          <Input label="Nombre *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ultraboost 22" />
          <Input label="Codigo de barras" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="4064057886687" />
          <Input label="Referencia" value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="GZ1234" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Talla" value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="42" />
            <Input label="Color" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Negro" />
          </div>
          <Input label="Categoria" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Running" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" size="lg" loading={saving} className="w-full mt-2">
            Guardar
          </Button>
        </form>
      </div>
    </div>
  )
}
