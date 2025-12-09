import { Template, TemplateCategory } from '@activepieces/shared';

import { CategorySection } from './category-section';

type AllCategoriesViewProps = {
  templatesByCategory: Record<TemplateCategory, Template[]>;
  onCategorySelect: (category: TemplateCategory) => void;
  onTemplateSelect: (template: Template) => void;
};

export const AllCategoriesView = ({
  templatesByCategory,
  onCategorySelect,
  onTemplateSelect,
}: AllCategoriesViewProps) => {
  return (
    <div className="space-y-6">
      {Object.values(TemplateCategory).map((category) => {
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
