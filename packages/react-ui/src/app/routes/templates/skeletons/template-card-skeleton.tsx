import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TemplateCardSkeleton = () => {
  return (
    <Card className="h-full w-[350px]">
      <CardContent className="py-5 px-4 flex flex-col gap-1">
        {/* Name skeleton */}
        <div className="h-14 flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        {/* Summary skeleton */}
        <div className="h-[4.5rem] flex flex-col gap-2 mt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Tags skeleton */}
        <div className="h-8 flex gap-2 mt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Piece Icons skeleton */}
        <div className="h-10 flex items-center gap-2 mt-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};
