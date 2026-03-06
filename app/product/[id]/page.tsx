'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Product, ProductLocation } from '@/lib/supabase/types'
import { LocationBadge } from '@/components/Product/LocationBadge'
import { ShelfDiagram } from '@/components/Shelf/ShelfDiagram'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { UserGreeting } from '@/components/ui/UserGreeting'
import { ProductDetailSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

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
  const [removing, setRemoving] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const role = useAuthStore((s) => s.role)
  const router = useRouter()
  const { showToast } = useToast()
  const isAdmin = role === 'admin' || role === 'superadmin'

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

  async function handleRemove() {
    if (!product) return
    if (!confirm('¿Quitar el producto del anaquel? El producto quedará como inactivo.')) return
    setRemoving(true)
    const res = await fetch(`/api/locations?product_id=${product.id}`, { method: 'DELETE' })
    setRemoving(false)
    if (res.ok) {
      showToast('Producto quitado del anaquel', 'success')
      router.replace('/')
    } else {
      showToast('Error al quitar el producto', 'error')
    }
  }

  async function handleReactivate() {
    if (!product) return
    setReactivating(true)
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setReactivating(false)
    if (res.ok) {
      showToast('Producto reactivado', 'success')
      router.replace(`/admin/assign?productId=${product.id}`)
    } else {
      showToast('Error al reactivar', 'error')
    }
  }

  if (loading) {
    return <ProductDetailSkeleton />
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

  const isInactive = product.status === 'inactive'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-white text-xl font-bold leading-tight">{product.name}</h1>
          {isInactive && (
            <span className="text-xs font-semibold bg-gray-600 text-gray-200 px-2 py-0.5 rounded-full">
              Inactivo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-gray-400 text-sm">SKU: {product.sku}</span>
          {product.reference && (
            <span className="text-gray-400 text-sm">Ref: {product.reference}</span>
          )}
        </div>
      </header>

      <main className="px-4 py-6 flex flex-col gap-6 pb-28">
        {/* Location card */}
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
            <div>
              <p className="text-xs text-gray-400">SKU</p>
              <p className="text-sm font-medium text-gray-800 font-mono">{product.sku}</p>
            </div>
            {product.reference && (
              <div>
                <p className="text-xs text-gray-400">Referencia</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{product.reference}</p>
              </div>
            )}
            {product.barcode && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Codigo de barras</p>
                <p className="text-sm font-medium text-gray-800 font-mono">{product.barcode}</p>
              </div>
            )}
            {product.category && (
              <div>
                <p className="text-xs text-gray-400">Categoria</p>
                <p className="text-sm font-medium text-gray-800">{product.category}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Admin actions */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
          {isInactive ? (
            <Button
              size="lg"
              className="w-full"
              onClick={handleReactivate}
              loading={reactivating}
            >
              Reactivar y asignar ubicacion
            </Button>
          ) : product.location ? (
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={handleRemove}
                loading={removing}
              >
                Quitar del anaquel
              </Button>
              <Link href={`/admin/assign?productId=${product.id}`} className="flex-1">
                <Button size="lg" className="w-full">
                  Cambiar ubicacion
                </Button>
              </Link>
            </div>
          ) : (
            <Link href={`/admin/assign?productId=${product.id}`}>
              <Button size="lg" className="w-full">
                Asignar ubicacion
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
