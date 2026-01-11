import { Template } from '@activepieces/shared';

import { CategorySection } from './category-section';
import { CategorySectionSkeleton } from './skeletons/category-section-skeleton';

type AllCategoriesViewSkeletonProps = {
  hideTitle?: boolean;
};

const AllCategoriesViewSkeleton = ({
  hideTitle = false,
}: AllCategoriesViewSkeletonProps) => {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, index) => (
        <CategorySectionSkeleton key={index} hideTitle={hideTitle} />
      ))}
    </div>
  );
};

type AllCategoriesViewProps = {
  templatesByCategory: Record<string, Template[]>;
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  hideTitle?: boolean;
};

export const AllCategoriesView = ({
  templatesByCategory,
  onCategorySelect,
  onTemplateSelect,
  isLoading = false,
  hideTitle = false,
}: AllCategoriesViewProps) => {
  if (isLoading) {
    return <AllCategoriesViewSkeleton hideTitle={hideTitle} />;
  }

  return (
    <div className="space-y-6">
      {Object.keys(templatesByCategory).map((category) => {
        const categoryTemplates = templatesByCategory[category];

        return (
          <CategorySection
            key={category}
            category={category}
            templates={categoryTemplates}
            onCategorySelect={onCategorySelect}
            onTemplateSelect={onTemplateSelect}
          />
        );
      })}
    </div>
  );
};
