import { Template } from '@activepieces/shared';

import { CategorySection } from './category-section';

type AllCategoriesViewProps = {
  templatesByCategory: Record<string, Template[]>;
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
};

export const AllCategoriesView = ({
  templatesByCategory,
  onCategorySelect,
  onTemplateSelect,
}: AllCategoriesViewProps) => {
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
