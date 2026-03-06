'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Product, ProductLocation, Shelf, ShelfLevel } from '@/lib/supabase/types'
import { useAuthStore } from '@/store/auth.store'
import { UserGreeting } from '@/components/ui/UserGreeting'
import { Skeleton } from '@/components/ui/Skeleton'

interface LocationWithProduct extends ProductLocation {
  product: Product
}

interface ShelfDetail {
  shelf: Shelf
  locations: LocationWithProduct[]
}

const LEVELS: { key: ShelfLevel; label: string; color: string; bg: string }[] = [
  { key: 'alto',  label: 'Alto',  color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  { key: 'medio', label: 'Medio', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { key: 'bajo',  label: 'Bajo',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
]

function LevelSection({
  level, label, color, bg, locations, shelfId,
}: {
  level: ShelfLevel
  label: string
  color: string
  bg: string
  locations: LocationWithProduct[]
  shelfId: string
}) {
  const role = useAuthStore((s) => s.role)
  const canAssign = role === 'admin' || role === 'superadmin'
  const items = locations.filter((l) => l.level === level)

  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-bold uppercase tracking-wide ${color}`}>{label}</p>
        <span className="text-xs text-gray-400">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 italic">Nivel vacío</p>
          {canAssign && (
            <Link
              href={`/admin/assign?shelfId=${shelfId}&level=${level}`}
              className="text-xs font-semibold text-black bg-white border border-gray-300 px-3 py-1.5 rounded-lg"
            >
              + Agregar
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((loc) => (
            <Link key={loc.id} href={`/product/${loc.product.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 flex items-center gap-3 active:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{loc.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {loc.product.sku}
                    {loc.product.reference ? ` · ${loc.product.reference}` : ''}
                  </p>
                  {loc.quantity > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{loc.quantity} en stock</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
          {canAssign && (
            <Link
              href={`/admin/assign?shelfId=${shelfId}&level=${level}`}
              className="text-xs font-semibold text-gray-500 text-center py-2 border border-dashed border-gray-300 rounded-xl bg-white/60"
            >
              + Agregar producto a este nivel
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function ShelfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<ShelfDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/shelves/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-black px-4 pt-12 pb-6">
          <Skeleton className="h-3 w-16 mb-4 bg-gray-700" />
          <Skeleton className="h-7 w-24 bg-gray-700" />
          <Skeleton className="h-4 w-40 mt-2 bg-gray-700" />
        </header>
        <main className="px-4 py-4 flex flex-col gap-4">
          {LEVELS.map((l) => (
            <div key={l.key} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-600">Anaquel no encontrado</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600">Volver</button>
      </div>
    )
  }

  const { shelf, locations } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-6">
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
        <h1 className="text-white text-3xl font-black">{shelf.code}</h1>
        {shelf.label && <p className="text-gray-300 text-sm mt-1">{shelf.label}</p>}
        {shelf.zone && <p className="text-gray-500 text-xs mt-0.5">Zona: {shelf.zone}</p>}
        <p className="text-gray-400 text-sm mt-2">
          {locations.length} producto{locations.length !== 1 ? 's' : ''} asignado{locations.length !== 1 ? 's' : ''}
        </p>
      </header>

      <main className="px-4 py-4 flex flex-col gap-4 pb-24">
        {LEVELS.map((l) => (
          <LevelSection
            key={l.key}
            level={l.key}
            label={l.label}
            color={l.color}
            bg={l.bg}
            locations={locations}
            shelfId={id}
          />
        ))}
      </main>
    </div>
  )
}
