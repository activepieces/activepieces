import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { PageSection } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExploreTemplateCard } from '@/features/templates/components/explore-template-card';

type CategorySectionProps = {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
};

export const CategorySection = React.memo(
  ({
    category,
    templates,
    onCategorySelect,
    onTemplateSelect,
  }: CategorySectionProps) => {
    if (!templates || templates.length === 0) return null;

    return (
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          slidesToScroll: 'auto',
        }}
        className="w-full"
      >
        <PageSection
          title={category}
          action={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategorySelect(category)}
              >
                {t('View all')}
              </Button>
              <div className="flex items-center gap-1">
                <CarouselPrevious
                  variant="ghost"
                  size="icon-sm"
                  className="static"
                >
                  <ChevronLeft />
                </CarouselPrevious>
                <CarouselNext variant="ghost" size="icon-sm" className="static">
                  <ChevronRight />
                </CarouselNext>
              </div>
            </>
          }
        >
          <CarouselContent>
            {templates.map((template) => (
              <CarouselItem
                key={template.id}
                className="min-w-[320px] basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <ExploreTemplateCard
                  template={template}
                  onTemplateSelect={onTemplateSelect}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </PageSection>
      </Carousel>
    );
  },
);

CategorySection.displayName = 'CategorySection';
