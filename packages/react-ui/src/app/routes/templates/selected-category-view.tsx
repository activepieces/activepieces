import { t } from 'i18next';
import { LayoutGrid } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Template } from '@activepieces/shared';

import { TemplateCardSkeleton } from './skeletons/template-card-skeleton';
import { ExploreTemplateCard } from './template-card';

type SelectedCategoryViewSkeletonProps = {
  showCategoryTitle?: boolean;
};

const SelectedCategoryViewSkeleton = ({
  showCategoryTitle = false,
}: SelectedCategoryViewSkeletonProps) => {
  return (
    <div className="space-y-4">
      {showCategoryTitle && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
        </div>
      )}

      <div className="flex flex-row flex-wrap gap-6 pb-4">
        {[...Array(6)].map((_, index) => (
          <TemplateCardSkeleton
            key={index}
            showCategoryCarouselButton={showCategoryTitle}
          />
        ))}
      </div>
    </div>
  );
};

type SelectedCategoryViewProps = {
  category?: string;
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  showCategoryTitle?: boolean;
};

export const SelectedCategoryView = ({
  category,
  templates,
  onTemplateSelect,
  isLoading = false,
  showCategoryTitle,
}: SelectedCategoryViewProps) => {
  if (isLoading) {
    return (
      <SelectedCategoryViewSkeleton showCategoryTitle={showCategoryTitle} />
    );
  }

  return (
    <div className="space-y-4">
      {showCategoryTitle && (
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{category}</h2>
        </div>
      )}

      {templates.length === 0 ? (
        <Empty className="min-h-[300px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGrid />
            </EmptyMedia>
            <EmptyTitle>{t('Empty category')}</EmptyTitle>
            <EmptyDescription>
              {t('No templates available at the moment')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-row flex-wrap gap-6 pb-4">
          {templates.map((template) => (
            <ExploreTemplateCard
              key={template.id}
              template={template}
              onTemplateSelect={onTemplateSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
