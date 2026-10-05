import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

import { TemplateCardSkeleton } from './template-card-skeleton';

type CategorySectionSkeletonProps = {
  hideHeader?: boolean;
};

export const CategorySectionSkeleton = ({
  hideHeader = false,
}: CategorySectionSkeletonProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: false,
      }}
      className="mt-4 flex w-full flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </div>

      <CarouselContent>
        {[...Array(4)].map((_, index) => (
          <CarouselItem
            key={index}
            className="min-w-[320px] basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
          >
            <TemplateCardSkeleton showCategoryCarouselButton={hideHeader} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
