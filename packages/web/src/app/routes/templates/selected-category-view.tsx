import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { LayoutGrid } from 'lucide-react';

import { PageSection } from '@/components/custom/page';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ExploreTemplateCard } from '@/features/templates/components/explore-template-card';
import { cn } from '@/lib/utils';

import { TemplateCardSkeleton } from './skeletons/template-card-skeleton';

type SelectedCategoryViewSkeletonProps = {
  showCategoryTitle?: boolean;
};

const SelectedCategoryViewSkeleton = ({
  showCategoryTitle = false,
}: SelectedCategoryViewSkeletonProps) => {
  return (
    <div className="flex flex-col gap-4">
      {showCategoryTitle && <Skeleton className="h-6 w-48" />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
    <PageSection
      title={showCategoryTitle ? category : undefined}
      className={cn(!showCategoryTitle && 'mt-0')}
    >
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {templates.map((template) => (
            <ExploreTemplateCard
              key={template.id}
              template={template}
              onTemplateSelect={onTemplateSelect}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
};
