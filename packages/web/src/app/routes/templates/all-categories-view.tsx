import { Template } from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

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

function LazyCategorySection({
  category,
  templates,
  onCategorySelect,
  onTemplateSelect,
}: {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? (
        <CategorySection
          category={category}
          templates={templates}
          onCategorySelect={onCategorySelect}
          onTemplateSelect={onTemplateSelect}
        />
      ) : (
        <CategorySectionSkeleton />
      )}
    </div>
  );
}

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
  const stableOnCategorySelect = useCallback(onCategorySelect, [onCategorySelect]);
  const stableOnTemplateSelect = useCallback(onTemplateSelect, [onTemplateSelect]);

  if (isLoading) {
    return <AllCategoriesViewSkeleton hideHeader={hideHeader} />;
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryTemplates = templatesByCategory[category];

        return (
          <LazyCategorySection
            key={category}
            category={category}
            templates={categoryTemplates}
            onCategorySelect={stableOnCategorySelect}
            onTemplateSelect={stableOnTemplateSelect}
          />
        );
      })}
    </div>
  );
};
