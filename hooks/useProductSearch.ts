'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { Product, ProductLocation } from '@/lib/supabase/types'

export interface ProductWithLocation extends Product {
  location: ProductLocation | null
}

async function searchProducts(q: string): Promise<ProductWithLocation[]> {
  const url = q.trim()
    ? `/api/products/search?q=${encodeURIComponent(q)}`
    : '/api/products/search'
  const res = await fetch(url)
  if (!res.ok) return []
  return res.json()
}

export function useProductSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(timer)
  }, [query])

  return useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
  })
}
