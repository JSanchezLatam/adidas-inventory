'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Product, ShelfLevel } from '@/lib/supabase/types'
import { ShelfPicker } from '@/components/Shelf/ShelfPicker'
import { LevelPicker } from '@/components/Shelf/LevelPicker'
import { ShelfDiagram } from '@/components/Shelf/ShelfDiagram'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { UserGreeting } from '@/components/ui/UserGreeting'

function AssignForm() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const shelfIdParam = searchParams.get('shelfId')
  const levelParam = searchParams.get('level') as ShelfLevel | null
  const router = useRouter()
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [shelfId, setShelfId] = useState<string | null>(shelfIdParam)
  const [level, setLevel] = useState<ShelfLevel | null>(levelParam)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  // Product search (used when coming from a shelf, no productId in URL)
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const activeProductId = productId ?? selectedProduct?.id ?? null

  useEffect(() => {
    if (!productId) return
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data)
        if (data.location) {
          if (!shelfIdParam) setShelfId(data.location.shelf_id)
          if (!levelParam) setLevel(data.location.level)
          setQuantity(String(data.location.quantity ?? ''))
          setNotes(data.location.notes ?? '')
        }
      })
  }, [productId, shelfIdParam, levelParam])

  useEffect(() => {
    if (!productQuery.trim()) { setProductResults([]); return }
    const timer = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(productQuery)}`)
        .then((r) => r.json())
        .then((data) => setProductResults(Array.isArray(data) ? data : []))
    }, 250)
    return () => clearTimeout(timer)
  }, [productQuery])

  async function handleSave() {
    if (!activeProductId || !shelfId || !level) {
      showToast('Selecciona anaquel y nivel', 'error')
      return
    }
    setSaving(true)
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: activeProductId,
        shelf_id: shelfId,
        level,
        quantity: parseInt(quantity) || 0,
        notes: notes || null,
      }),
    })

    setSaving(false)
    if (res.ok) {
      showToast('Ubicacion guardada', 'success')
      if (shelfIdParam && !productId) {
        router.replace(`/admin/shelves/${shelfIdParam}`)
      } else {
        router.replace(`/product/${activeProductId}`)
      }
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Error al guardar', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-black px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
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
        <h1 className="text-white text-xl font-bold">Asignar ubicacion</h1>
        {product && (
          <p className="text-gray-400 text-sm mt-1">{product.name}</p>
        )}
      </header>

      <main className="px-4 py-6 flex flex-col gap-6 pb-32">
        {/* Product search — shown when entering from a shelf (no productId in URL) */}
        {!productId && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">1. Selecciona el producto</p>
            {selectedProduct ? (
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-3 border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-400">{selectedProduct.sku}</p>
                </div>
                <button
                  onClick={() => { setSelectedProduct(null); setProductQuery('') }}
                  className="text-xs text-gray-400 hover:text-red-500 ml-3"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o referencia..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
                {productResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedProduct(p); setProductQuery(''); setProductResults([]) }}
                        className="text-left px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shelf picker */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">{productId ? '1' : '2'}. Selecciona el anaquel</p>
          <ShelfPicker value={shelfId} onChange={setShelfId} />
        </div>

        {/* Level picker */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">{productId ? '2' : '3'}. Selecciona el nivel</p>
          <LevelPicker value={level} onChange={setLevel} />
        </div>

        {/* Preview diagram */}
        {level && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Vista previa</p>
            <ShelfDiagram activeLevel={level} />
          </div>
        )}

        {/* Quantity & notes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col gap-4">
          <p className="text-sm font-semibold text-gray-700">{productId ? '3' : '4'}. Opcional</p>
          <Input
            label="Cantidad en stock"
            type="number"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: ultima caja, producto fragil..."
          />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          loading={saving}
          disabled={!activeProductId || !shelfId || !level}
        >
          Guardar ubicacion
        </Button>
      </div>
    </div>
  )
}

export default function AssignLocationPage() {
  return (
    <Suspense>
      <AssignForm />
    </Suspense>
  )
}
