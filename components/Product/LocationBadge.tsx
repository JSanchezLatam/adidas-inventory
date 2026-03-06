import type { ProductLocation } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface LocationBadgeProps {
  location: ProductLocation | null
  large?: boolean
}

const levelColors = {
  alto: 'bg-blue-100 text-blue-800',
  medio: 'bg-yellow-100 text-yellow-800',
  bajo: 'bg-green-100 text-green-800',
}

const levelLabels = {
  alto: 'ALTO',
  medio: 'MEDIO',
  bajo: 'BAJO',
}

export function LocationBadge({ location, large }: LocationBadgeProps) {
  if (!location) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-lg px-3 py-1 font-semibold bg-orange-100 text-orange-700',
          large ? 'text-sm px-4 py-2' : 'text-xs'
        )}
      >
        Sin ubicacion
      </span>
    )
  }

  const shelfCode = (location.shelf as { code?: string })?.code ?? '—'
  const levelLabel = levelLabels[location.level] ?? location.level.toUpperCase()
  const levelColor = levelColors[location.level] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className={cn('flex items-center gap-2', large && 'gap-3')}>
      <span
        className={cn(
          'inline-flex items-center rounded-lg font-bold bg-black text-white',
          large ? 'px-4 py-2 text-lg' : 'px-3 py-1 text-xs'
        )}
      >
        {shelfCode}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-lg font-semibold uppercase tracking-wide',
          levelColor,
          large ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'
        )}
      >
        {levelLabel}
      </span>
    </div>
  )
}
