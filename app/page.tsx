'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProductSearch } from '@/hooks/useProductSearch'
import { ProductCard } from '@/components/Product/ProductCard'
import { ScannerModal } from '@/components/Scanner/ScannerModal'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'
import { UserGreeting } from '@/components/ui/UserGreeting'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const { data: results, isLoading } = useProductSearch(query)
  const router = useRouter()
  const { showToast } = useToast()
  const { role, clearAuth } = useAuthStore()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  const handleScan = useCallback(
    async (code: string) => {
      // Log the scan
      fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanned_value: code, action: 'lookup' }),
      }).catch(() => {})

      // Resolve code
      const res = await fetch(`/api/products/resolve/${encodeURIComponent(code)}`)
      if (res.ok) {
        const data = await res.json()
        router.push(`/product/${data.product.id}`)
      } else {
        setQuery(code)
        showToast(`Codigo no encontrado: ${code}`, 'error')
      }
    },
    [router, showToast]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest">adidas</p>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <UserGreeting />
        </div>
        <h1 className="text-white text-xl font-bold">Bodega</h1>
        {/* Search bar */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, SKU, referencia o codigo..."
              className="w-full rounded-xl bg-gray-800 text-white placeholder:text-gray-500 pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          {/* Camera button */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white text-black hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Escanear codigo"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M21 9V5a2 2 0 00-2-2h-4M21 15v4a2 2 0 01-2 2h-4M8 12h8" />
            </svg>
          </button>
        </div>
      </header>

      {/* Results */}
      <main className="px-4 py-4 pb-24 flex flex-col gap-3">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && results?.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600 font-medium">Sin resultados para &ldquo;{query}&rdquo;</p>
            <p className="text-gray-400 text-sm mt-1">Verifica el codigo o usa el escaner</p>
          </div>
        )}

        {/* Product cards */}
        {!isLoading && results?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        <a href="/" className="flex-1 flex flex-col items-center py-3 text-black">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span className="text-xs mt-1 font-semibold">Buscar</span>
        </a>
        {role === 'admin' && (
          <a href="/admin" className="flex-1 flex flex-col items-center py-3 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Admin</span>
          </a>
        )}
      </nav>

      {showScanner && (
        <ScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
