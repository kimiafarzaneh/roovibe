import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-full px-4 py-4 space-y-6">
      <section className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="w-full aspect-[4/5] rounded-2xl mb-4 break-inside-avoid" />
          ))}
        </div>
      </section>
    </div>
  );
}
