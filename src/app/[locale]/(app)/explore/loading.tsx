import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <div className="min-h-full px-4 py-4 space-y-4">
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-8 w-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="break-inside-avoid mb-4 space-y-2">
            <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
