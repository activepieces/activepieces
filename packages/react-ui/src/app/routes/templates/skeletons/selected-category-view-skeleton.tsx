import { Skeleton } from '@/components/ui/skeleton';

import { TemplateCardSkeleton } from './template-card-skeleton';

export const SelectedCategoryViewSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-4">
        {[...Array(6)].map((_, index) => (
          <TemplateCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
