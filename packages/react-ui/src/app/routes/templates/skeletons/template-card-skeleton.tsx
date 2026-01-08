import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TemplateCardSkeletonProps = {
  hideTitle?: boolean;
};

export const TemplateCardSkeleton = ({
  hideTitle = false,
}: TemplateCardSkeletonProps) => {
  return (
    <Card className="h-[260px] w-[330px] flex flex-col">
      <CardContent className="py-5 px-4 flex flex-col gap-1 flex-1 min-h-0">
        {!hideTitle && (
          <div className="h-14 flex flex-col gap-2 flex-shrink-0">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-1 flex-shrink-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="h-8 flex gap-2 mt-1 flex-shrink-0">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>

      <div className="h-16 flex items-center px-4 rounded-b-lg">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full ml-2" />
        <Skeleton className="h-8 w-8 rounded-full ml-2" />
        <Skeleton className="h-8 w-8 rounded-full ml-2" />
      </div>
    </Card>
  );
};
