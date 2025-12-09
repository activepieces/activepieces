import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { formatUtils } from '@/lib/utils';
import { Template, TemplateCategory } from '@activepieces/shared';

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
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">
            {formatUtils.convertEnumToHumanReadable(category)}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onCategorySelect(category)}
              className="flex items-center gap-1"
            >
              {t('View All')}
            </Button>
            <div className="flex items-center gap-1">
              <CarouselPrevious
                variant="ghost"
                className="static translate-y-0 h-8 w-8"
              />
              <CarouselNext
                variant="ghost"
                className="static translate-y-0 h-8 w-8"
              />
            </div>
          </div>
        </div>

        <CarouselContent className="pb-3 gap-6">
          {templates.map((template) => (
            <CarouselItem
              key={template.id}
              className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-[320px]"
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
