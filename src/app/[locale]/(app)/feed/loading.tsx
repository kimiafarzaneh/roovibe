import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="p-4 columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="break-inside-avoid mb-4 space-y-2">
          <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
