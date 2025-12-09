import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { formatUtils } from '@/lib/utils';
import { TemplateCategory } from '@activepieces/shared';

type CategoryFilterCarouselProps = {
  categories: (TemplateCategory | 'All')[];
  selectedCategory: TemplateCategory | 'All';
  onCategorySelect: (category: TemplateCategory | 'All') => void;
};

export const CategoryFilterCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const formatCategoryName = (category: TemplateCategory | 'All') => {
    if (category === 'All') return 'All';
    return formatUtils.convertEnumToHumanReadable(category);
  };

  return (
    <div className="relative px-12 my-4">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="w-full"
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
        <CarouselPrevious variant="ghost" />
        <CarouselNext variant="ghost" />
      </Carousel>
    </div>
  );
};
