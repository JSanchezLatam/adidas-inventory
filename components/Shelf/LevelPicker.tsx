'use client'

import type { ShelfLevel } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface LevelPickerProps {
  value: ShelfLevel | null
  onChange: (level: ShelfLevel) => void
}

const levels: { key: ShelfLevel; label: string; description: string }[] = [
  { key: 'alto', label: 'ALTO', description: 'Nivel superior' },
  { key: 'medio', label: 'MEDIO', description: 'Nivel central' },
  { key: 'bajo', label: 'BAJO', description: 'Nivel inferior' },
]

export function LevelPicker({ value, onChange }: LevelPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {levels.map(({ key, label, description }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'flex flex-col items-center justify-center h-20 rounded-2xl border-2 font-bold text-sm transition-all',
            value === key
              ? 'border-black bg-black text-white shadow-md scale-105'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 active:bg-gray-50'
          )}
        >
          <span className="text-base">{label}</span>
          <span className={cn('text-xs font-normal mt-1', value === key ? 'text-gray-300' : 'text-gray-400')}>
            {description}
          </span>
        </button>
      ))}
    </div>
  )
}
