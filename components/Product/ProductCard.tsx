import Link from 'next/link'
import type { ProductWithLocation } from '@/hooks/useProductSearch'
import { LocationBadge } from './LocationBadge'

interface ProductCardProps {
  product: ProductWithLocation
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3 active:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 leading-tight truncate">{product.name}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">SKU: {product.sku}</span>
              {product.reference && (
                <span className="text-xs text-gray-500">Ref: {product.reference}</span>
              )}
              {product.size && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Talla {product.size}
                </span>
              )}
              {product.color && (
                <span className="text-xs text-gray-500">{product.color}</span>
              )}
            </div>
          </div>
        </div>
        <LocationBadge location={product.location} />
      </div>
    </Link>
  )
}
