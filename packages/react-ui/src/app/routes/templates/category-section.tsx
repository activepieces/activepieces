import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  CATEGORY_DISPLAY_NAMES,
  Template,
  TemplateCategory,
} from '@activepieces/shared';

import { ExploreTemplateCard } from './template-card';

type CategorySectionProps = {
  category: TemplateCategory;
  templates: Template[];
  onCategorySelect: (category: TemplateCategory) => void;
  onTemplateSelect: (template: Template) => void;
};

export const CategorySection = ({
  category,
  templates,
  onCategorySelect,
  onTemplateSelect,
}: CategorySectionProps) => {
  if (!templates || templates.length === 0) return null;

  return (
    <div className="space-y-4">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          slidesToScroll: 'auto',
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {CATEGORY_DISPLAY_NAMES[category]}
          </h2>
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => onCategorySelect(category)}
              className="flex items-center"
            >
              {t('View all')}
            </Button>
            <div className="flex items-center">
              <CarouselPrevious
                variant="ghost"
                className="static translate-y-0 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </CarouselPrevious>
              <CarouselNext
                variant="ghost"
                className="static translate-y-0 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </CarouselNext>
            </div>
          </div>
        </div>

        <CarouselContent className="pb-3 gap-6">
          {templates.map((template) => (
            <CarouselItem
              key={template.id}
              className="basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-[320px]"
            >
              <ExploreTemplateCard
                template={template}
                onTemplateSelect={onTemplateSelect}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
