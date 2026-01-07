import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

import { TemplateCardSkeleton } from './template-card-skeleton';

type CategorySectionSkeletonProps = {
  hideTitle?: boolean;
};

export const CategorySectionSkeleton = ({
  hideTitle = false,
}: CategorySectionSkeletonProps) => {
  return (
    <div className="space-y-4">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        <CarouselContent className="pb-3 gap-6">
          {[...Array(4)].map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-[350px]"
            >
              <TemplateCardSkeleton hideTitle={hideTitle} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
