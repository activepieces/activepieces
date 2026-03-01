import { Template } from '@activepieces/shared';

import { CategorySection } from './category-section';
import { CategorySectionSkeleton } from './skeletons/category-section-skeleton';

type AllCategoriesViewSkeletonProps = {
  hideHeader?: boolean;
};

const AllCategoriesViewSkeleton = ({
  hideHeader = false,
}: AllCategoriesViewSkeletonProps) => {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, index) => (
        <CategorySectionSkeleton key={index} hideHeader={hideHeader} />
      ))}
    </div>
  );
};

type AllCategoriesViewProps = {
  templatesByCategory: Record<string, Template[]>;
  categories: string[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
  isLoading?: boolean;
  hideHeader?: boolean;
};

export const AllCategoriesView = ({
  templatesByCategory,
  categories,
  onCategorySelect,
  onTemplateSelect,
  isLoading = false,
  hideHeader = false,
}: AllCategoriesViewProps) => {
  if (isLoading) {
    return <AllCategoriesViewSkeleton hideHeader={hideHeader} />;
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
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
