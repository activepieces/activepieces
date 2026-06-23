import { Skeleton } from '@/components/ui/skeleton';

export const JsonTreeSkeleton = () => (
  <div className="flex flex-col gap-3 py-3 animate-pulse">
    <Skeleton className="h-3 w-24" />
    <div className="pl-4 flex flex-col gap-2.5">
      <Skeleton className="h-3 w-32" />
      <div className="pl-4 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-44" />
      </div>
      <Skeleton className="h-3 w-28" />
      <div className="pl-4 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);
