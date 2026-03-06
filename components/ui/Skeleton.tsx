export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ''}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
      </div>
    </div>
  )
}

export function ShelfCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <Skeleton className="h-5 w-10 mx-auto" />
      <Skeleton className="h-3 w-14 mx-auto mt-2" />
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black px-4 pt-12 pb-6">
        <Skeleton className="h-3 w-12 mb-4 bg-gray-700" />
        <Skeleton className="h-6 w-3/4 bg-gray-700" />
        <Skeleton className="h-4 w-1/2 mt-2 bg-gray-700" />
      </header>
      <main className="px-4 py-6 flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      </main>
    </div>
  )
}
