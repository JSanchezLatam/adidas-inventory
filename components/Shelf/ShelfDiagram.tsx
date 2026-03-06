import type { ShelfLevel } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface ShelfDiagramProps {
  activeLevel: ShelfLevel | null
}

const levels: { key: ShelfLevel; label: string }[] = [
  { key: 'alto', label: 'ALTO' },
  { key: 'medio', label: 'MEDIO' },
  { key: 'bajo', label: 'BAJO' },
]

export function ShelfDiagram({ activeLevel }: ShelfDiagramProps) {
  return (
    <div className="flex flex-col gap-1 w-full max-w-xs mx-auto">
      {levels.map(({ key, label }) => (
        <div
          key={key}
          className={cn(
            'flex items-center justify-center h-14 rounded-lg border-2 font-semibold text-sm transition-all',
            activeLevel === key
              ? 'border-black bg-black text-white scale-105 shadow-md'
              : 'border-gray-300 bg-gray-50 text-gray-400'
          )}
        >
          {label}
          {activeLevel === key && <span className="ml-2">← aqui</span>}
        </div>
      ))}
      {/* Base/floor */}
      <div className="h-3 bg-gray-300 rounded-b-lg" />
    </div>
  )
}
