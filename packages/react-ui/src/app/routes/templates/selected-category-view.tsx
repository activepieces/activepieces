import { t } from 'i18next';
import { LayoutGrid } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Template,
  TemplateCategory,
  CATEGORY_DISPLAY_NAMES,
} from '@activepieces/shared';

import { ExploreTemplateCard } from './template-card';

type SelectedCategoryViewProps = {
  category?: TemplateCategory;
  templates: Template[];
  onTemplateSelect: (template: Template) => void;
};

export const SelectedCategoryView = ({
  category,
  templates,
  onTemplateSelect,
}: SelectedCategoryViewProps) => {
  const categoryName = category ? CATEGORY_DISPLAY_NAMES[category] : undefined;

  return (
    <div className="space-y-4">
      {categoryName && (
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{categoryName}</h2>
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
