import { Skeleton } from '@/components/ui/skeleton';

import { TemplateCardSkeleton } from './template-card-skeleton';

export const SelectedCategoryViewSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="flex flex-row flex-wrap gap-6 pb-4">
        {[...Array(6)].map((_, index) => (
          <TemplateCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};
