import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer rounded-lg", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-card p-5">
      {/* Date column */}
      <div className="flex sm:flex-col gap-3 sm:gap-2 min-w-[100px]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="hidden sm:block w-px h-14 bg-border" />
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      {/* CTA */}
      <div className="flex sm:flex-col items-center sm:items-end gap-3">
        <div className="w-28 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
