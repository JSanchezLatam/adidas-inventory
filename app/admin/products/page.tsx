'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'
import { UserGreeting } from '@/components/ui/UserGreeting'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const router = useRouter()
  const { role } = useAuthStore()
  const isSuperAdmin = role === 'superadmin'

  async function handleDelete(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return
    setDeletingId(p.id)
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
      showToast('Producto eliminado', 'success')
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Error al eliminar', 'error')
    }
  }

  async function handleReactivate(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    if (res.ok) {
      showToast('Producto reactivado', 'success')
      router.push(`/admin/assign?productId=${p.id}`)
    } else {
      showToast('Error al reactivar', 'error')
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      (p.reference ?? '').toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    // Load all products including inactive for admin view
    fetch('/api/products/search?all=true')
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
      fetch('/api/products/search?all=true').then((r) => r.json()).then(setProducts)
    } else {
      showToast(data.error ?? 'Error al importar', 'error')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-black px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <UserGreeting />
        </div>
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
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : (
          filtered.map((p) => {
            const isInactive = p.status === 'inactive'
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${
                  isInactive ? 'border-gray-100 opacity-60' : 'border-gray-200'
                }`}
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer active:opacity-70"
                  onClick={() => router.push(`/product/${p.id}`)}
                >
                  <p className={`font-medium text-sm truncate ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{p.sku}</p>
                    {isInactive && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        inactivo
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isInactive && (
                    <button
                      onClick={() => handleReactivate(p)}
                      className="text-xs text-blue-600 font-medium px-1"
                    >
                      Reactivar
                    </button>
                  )}
                  {isSuperAdmin ? (
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="text-xs text-red-500 disabled:opacity-40 px-1"
                    >
                      {deletingId === p.id ? '...' : 'Eliminar'}
                    </button>
                  ) : !isInactive ? (
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : null}
                </div>
              </div>
            )
          })
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
          onReactivate={(p) => {
            setShowForm(false)
            handleReactivate(p)
          }}
        />
      )}
    </div>
  )
}

function AddProductModal({
  onClose,
  onSaved,
  onReactivate,
}: {
  onClose: () => void
  onSaved: (p: Product) => void
  onReactivate: (p: Product) => void
}) {
  const [form, setForm] = useState({ sku: '', name: '', barcode: '', reference: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inactiveProduct, setInactiveProduct] = useState<Product | null>(null)

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
    setError('')
    setInactiveProduct(null)
    const body = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() || null])
    )
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.status === 409) {
      const data = await res.json()
      if (data.error === 'inactive') {
        setInactiveProduct(data.product)
      } else {
        setError(data.error ?? 'El producto ya existe')
      }
      return
    }
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

        {inactiveProduct ? (
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Producto inactivo encontrado</p>
              <p className="text-sm text-amber-700">
                <strong>{inactiveProduct.name}</strong> ({inactiveProduct.sku}) ya existe en el sistema pero está marcado como inactivo.
              </p>
              <p className="text-sm text-amber-700 mt-1">¿Deseas reactivarlo y asignarle una ubicacion?</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => onReactivate(inactiveProduct)}>
              Reactivar y asignar ubicacion
            </Button>
            <button onClick={() => setInactiveProduct(null)} className="text-sm text-gray-500 text-center">
              Cancelar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="SKU *" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="HQ8707" />
            <Input label="Nombre *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Termo Adidas 500ml" />
            <Input label="Codigo de barras" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="4064057886687" />
            <Input label="Referencia" value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="GZ1234" />
            {/* <Input label="Categoria" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Running" /> */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" size="lg" loading={saving} className="w-full mt-2">
              Guardar
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
