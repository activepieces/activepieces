import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TemplateCardSkeletonProps = {
  showCategoryCarouselButton?: boolean;
};

export const TemplateCardSkeleton = ({
  showCategoryCarouselButton = false,
}: TemplateCardSkeletonProps) => {
  return (
    <Card className="h-56 w-full gap-0 pb-0">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
        {showCategoryCarouselButton && (
          <div className="flex h-10 shrink-0 flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        <div className="flex shrink-0 flex-col gap-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Skeleton className="h-6 w-24" />
      </CardContent>
      <div className="flex h-14 items-center gap-2 px-4">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </Card>
  );
};
