'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { Product, ProductLocation } from '@/lib/supabase/types'

export interface ProductWithLocation extends Product {
  location: ProductLocation | null
}

async function searchProducts(q: string): Promise<ProductWithLocation[]> {
  if (!q.trim()) return []
  const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  return res.json()
}

export function useProductSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min cache for offline
    gcTime: 1000 * 60 * 30,   // 30 min in memory
  })
}
