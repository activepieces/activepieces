import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { formatUtils } from '@/lib/utils';
import { TemplateCategory } from '@activepieces/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CategoryFilterCarouselProps = {
  categories: (TemplateCategory | 'All')[];
  selectedCategory: TemplateCategory | 'All';
  onCategorySelect: (category: TemplateCategory | 'All') => void;
};

const CarouselContentWithButtons = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  const formatCategoryName = (category: TemplateCategory | 'All') => {
    if (category === 'All') return 'All';
    return formatUtils.convertEnumToHumanReadable(category);
  };

  return (
    <div
      className="relative my-4 transition-[padding] duration-200"
      style={{
        paddingLeft: canScrollPrev ? '3rem' : '0',
        paddingRight: canScrollNext ? '3rem' : '0',
      }}
    >
      <CarouselContent className="-ml-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <CarouselItem key={category} className="basis-auto pl-2">
              <Button
                variant="outline"
                onClick={() => onCategorySelect(category)}
                className={`px-6 py-2 h-auto whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-black text-white border-black hover:!bg-black hover:!text-white'
                    : 'hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {formatCategoryName(category)}
              </Button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {canScrollPrev && (
        <CarouselPrevious
          variant="ghost"
          className="left-0 z-10"
        >
          <ChevronLeft className="h-4 w-4" />
        </CarouselPrevious>
      )}
      {canScrollNext && (
        <CarouselNext
          variant="ghost"
          className="right-0 z-10"
        >
          <ChevronRight className="h-4 w-4" />
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
