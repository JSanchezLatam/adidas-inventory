import Papa from 'papaparse'
import type { Database } from '@/lib/supabase/types'

type ProductInsert = Database['public']['Tables']['products']['Insert']

export interface CSVParseResult {
  products: ProductInsert[]
  errors: string[]
}

const REQUIRED_COLUMNS = ['sku', 'name']

export function parseProductsCSV(csvText: string): CSVParseResult {
  const errors: string[] = []
  const products: ProductInsert[] = []

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  // Validate required columns
  const headers = result.meta.fields ?? []
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push(`Columna requerida faltante: "${col}"`)
    }
  }

  if (errors.length > 0) {
    return { products: [], errors }
  }

  result.data.forEach((row, i) => {
    const lineNum = i + 2 // account for header row

    if (!row.sku?.trim()) {
      errors.push(`Fila ${lineNum}: SKU vacío`)
      return
    }
    if (!row.name?.trim()) {
      errors.push(`Fila ${lineNum}: nombre vacío`)
      return
    }

    products.push({
      sku: row.sku.trim(),
      name: row.name.trim(),
      barcode: row.barcode?.trim() || null,
      reference: row.reference?.trim() || row.ref?.trim() || null,
      size: row.size?.trim() || row.talla?.trim() || null,
      color: row.color?.trim() || null,
      category: row.category?.trim() || row.categoria?.trim() || null,
      status: 'active',
    })
  })

  return { products, errors }
}
