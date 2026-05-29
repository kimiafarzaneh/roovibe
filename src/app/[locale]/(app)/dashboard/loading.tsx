import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-full bg-background relative max-w-lg mx-auto w-full border-x">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
