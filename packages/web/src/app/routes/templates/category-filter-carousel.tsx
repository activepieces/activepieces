import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type CategoryFilterCarouselProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
};

const CarouselContentWithButtons = ({
  className,
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  return (
    <div
      className={`relative my-4 transition-[padding] duration-200 py-3 border-b border-t `}
      style={{
        paddingLeft: canScrollPrev ? '3rem' : '0',
        paddingRight: canScrollNext ? '3rem' : '0',
      }}
    >
      <CarouselContent className={cn('-ml-2 gap-1', className)}>
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <CarouselItem key={category} className="basis-auto pl-2">
              <Button
                variant="outline"
                onClick={() => onCategorySelect(category)}
                className={`px-4 py-1.5 h-auto whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-gray-12 text-gray-1 border-gray-12 hover:!bg-gray-12 hover:!text-gray-1'
                    : 'bg-transparent hover:!bg-gray-4 hover:!text-gray-12 border-none'
                }`}
              >
                {category}
              </Button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {canScrollPrev && (
        <CarouselPrevious variant="ghost" className="left-0 z-10">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </CarouselPrevious>
      )}
      {canScrollNext && (
        <CarouselNext variant="ghost" className="right-0 z-10">
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
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
        className={DASHBOARD_CONTENT_PADDING_X}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={onCategorySelect}
      />
    </Carousel>
  );
};
