import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product, ProductLocation } from '@/lib/supabase/types'

export interface ResolvedProduct {
  product: Product
  location: ProductLocation | null
}

/**
 * Resolves a scanned value to a product.
 * Tries: barcode → sku → reference (in that order).
 */
export async function resolveCode(
  supabase: SupabaseClient,
  code: string
): Promise<ResolvedProduct | null> {
  const trimmed = code.trim()

  // Try barcode first
  let { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', trimmed)
    .single()

  // Try SKU
  if (!product) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('sku', trimmed)
      .single()
    product = data
  }

  // Try reference
  if (!product) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .ilike('reference', trimmed)
      .single()
    product = data
  }

  if (!product) return null

  const typedProduct = product as Product

  const { data: location } = await supabase
    .from('product_locations')
    .select('*, shelf:shelves(*)')
    .eq('product_id', typedProduct.id)
    .single()

  return { product: typedProduct, location: (location as ProductLocation | null) ?? null }
}
