import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type CategoryFilterCarouselProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
};

const CarouselContentWithButtons = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  return (
    <div
      className={cn(
        'relative transition-[padding] duration-200',
        canScrollPrev && 'pl-10',
        canScrollNext && 'pr-10',
      )}
    >
      <CarouselContent className="gap-1">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <CarouselItem key={category} className="basis-auto">
              <Button
                variant={isSelected ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onCategorySelect(category)}
                className={cn(!isSelected && 'text-gray-11')}
              >
                {category}
              </Button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {canScrollPrev && (
        <CarouselPrevious variant="ghost" className="left-0 z-10">
          <ChevronLeft />
        </CarouselPrevious>
      )}
      {canScrollNext && (
        <CarouselNext variant="ghost" className="right-0 z-10">
          <ChevronRight />
        </CarouselNext>
      )}
    </div>
  );
};

export const CategoryFilterCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: false,
      }}
      className="w-full"
    >
      <CarouselContentWithButtons
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
    </Carousel>
  );
};
