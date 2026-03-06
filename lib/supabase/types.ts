export type ShelfLevel = 'bajo' | 'medio' | 'alto'
export type UserRole = 'staff' | 'admin' | 'superadmin'

export interface Shelf {
  id: string
  code: string
  label: string | null
  zone: string | null
  created_at: string
}

export interface Product {
  id: string
  sku: string
  barcode: string | null
  reference: string | null
  name: string
  size: string | null
  color: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export interface ProductLocation {
  id: string
  product_id: string
  shelf_id: string
  level: ShelfLevel
  quantity: number
  notes: string | null
  assigned_by: string | null
  updated_at: string
  // Joined
  shelf?: Shelf
  product?: Product
}

export interface ScanLog {
  id: string
  user_id: string | null
  scanned_value: string
  resolved_product_id: string | null
  action: 'lookup' | 'assign'
  created_at: string
}

export interface UserProfile {
  id: string
  username: string
  role: UserRole
  name: string
  created_at: string
}

// Supabase Database type (used by client/server)
export type Database = {
  public: {
    Tables: {
      shelves: {
        Row: Shelf
        Insert: Omit<Shelf, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Shelf, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      product_locations: {
        Row: ProductLocation
        Insert: Omit<ProductLocation, 'id' | 'updated_at' | 'shelf' | 'product'> & { id?: string }
        Update: Partial<Omit<ProductLocation, 'id' | 'shelf' | 'product'>>
      }
      scan_logs: {
        Row: ScanLog
        Insert: Omit<ScanLog, 'id' | 'created_at'> & { id?: string }
        Update: never
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at'> & { id: string }
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      shelf_level: ShelfLevel
      user_role: UserRole
    }
  }
}
