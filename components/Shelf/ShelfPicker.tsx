'use client'

import { useEffect, useState } from 'react'
import type { Shelf } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface ShelfPickerProps {
  value: string | null
  onChange: (shelfId: string) => void
}

export function ShelfPicker({ value, onChange }: ShelfPickerProps) {
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shelves')
      .then((r) => r.json())
      .then((data: Shelf[]) => {
        setShelves(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  // Group by zone
  const zones = Array.from(new Set(shelves.map((s) => s.zone ?? 'General')))

  return (
    <div className="flex flex-col gap-4">
      {zones.map((zone) => (
        <div key={zone}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{zone}</p>
          <div className="grid grid-cols-4 gap-2">
            {shelves
              .filter((s) => (s.zone ?? 'General') === zone)
              .map((shelf) => (
                <button
                  key={shelf.id}
                  type="button"
                  onClick={() => onChange(shelf.id)}
                  className={cn(
                    'h-16 rounded-xl border-2 font-bold text-sm transition-all',
                    value === shelf.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  )}
                >
                  {shelf.code}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
