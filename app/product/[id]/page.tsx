'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Product, ProductLocation } from '@/lib/supabase/types'
import { LocationBadge } from '@/components/Product/LocationBadge'
import { ShelfDiagram } from '@/components/Shelf/ShelfDiagram'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'

interface ProductWithLocation extends Product {
  location: ProductLocation | null
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [product, setProduct] = useState<ProductWithLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const role = useAuthStore((s) => s.role)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-600 text-lg">Producto no encontrado</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        <h1 className="text-white text-xl font-bold leading-tight">{product.name}</h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-gray-400 text-sm">SKU: {product.sku}</span>
          {product.reference && (
            <span className="text-gray-400 text-sm">Ref: {product.reference}</span>
          )}
        </div>
      </header>

      <main className="px-4 py-6 flex flex-col gap-6 pb-28">
        {/* Location card — most prominent */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ubicacion en bodega
          </p>
          {product.location ? (
            <>
              <LocationBadge location={product.location} large />
              {product.location.quantity > 0 && (
                <p className="text-sm text-gray-500 mt-3">
                  {product.location.quantity} unidad{product.location.quantity !== 1 ? 'es' : ''} en stock
                </p>
              )}
              {product.location.notes && (
                <p className="text-sm text-gray-500 mt-1 italic">{product.location.notes}</p>
              )}
            </>
          ) : (
            <p className="text-orange-600 font-semibold">Sin ubicacion asignada</p>
          )}
        </div>

        {/* Shelf diagram */}
        {product.location && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Diagrama del anaquel
            </p>
            <ShelfDiagram activeLevel={product.location.level} />
          </div>
        )}

        {/* Product details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Detalles del producto
          </p>
          <div className="grid grid-cols-2 gap-3">
            {product.category && (
              <div>
                <p className="text-xs text-gray-400">Categoria</p>
                <p className="text-sm font-medium text-gray-800">{product.category}</p>
              </div>
            )}
            {product.size && (
              <div>
                <p className="text-xs text-gray-400">Talla</p>
                <p className="text-sm font-medium text-gray-800">{product.size}</p>
              </div>
            )}
            {product.color && (
              <div>
                <p className="text-xs text-gray-400">Color</p>
                <p className="text-sm font-medium text-gray-800">{product.color}</p>
              </div>
            )}
            {product.barcode && (
              <div>
                <p className="text-xs text-gray-400">Codigo de barras</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{product.barcode}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Admin action */}
      {role === 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          <Link href={`/admin/assign?productId=${product.id}`}>
            <Button size="lg" className="w-full">
              {product.location ? 'Cambiar ubicacion' : 'Asignar ubicacion'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
