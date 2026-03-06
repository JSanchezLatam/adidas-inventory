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

function AssignForm() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const router = useRouter()
  const { showToast } = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [shelfId, setShelfId] = useState<string | null>(null)
  const [level, setLevel] = useState<ShelfLevel | null>(null)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!productId) return
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data)
        if (data.location) {
          setShelfId(data.location.shelf_id)
          setLevel(data.location.level)
          setQuantity(String(data.location.quantity ?? ''))
          setNotes(data.location.notes ?? '')
        }
      })
  }, [productId])

  async function handleSave() {
    if (!productId || !shelfId || !level) {
      showToast('Selecciona anaquel y nivel', 'error')
      return
    }
    setSaving(true)
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        shelf_id: shelfId,
        level,
        quantity: parseInt(quantity) || 0,
        notes: notes || null,
      }),
    })

    setSaving(false)
    if (res.ok) {
      showToast('Ubicacion guardada', 'success')
      router.push(`/product/${productId}`)
    } else {
      const data = await res.json()
      showToast(data.error ?? 'Error al guardar', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 text-sm mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1 className="text-white text-xl font-bold">Asignar ubicacion</h1>
        {product && (
          <p className="text-gray-400 text-sm mt-1">{product.name}</p>
        )}
      </header>

      <main className="px-4 py-6 flex flex-col gap-6 pb-32">
        {/* Shelf picker */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">1. Selecciona el anaquel</p>
          <ShelfPicker value={shelfId} onChange={setShelfId} />
        </div>

        {/* Level picker */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">2. Selecciona el nivel</p>
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
          <p className="text-sm font-semibold text-gray-700">3. Opcional</p>
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
          disabled={!shelfId || !level}
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
