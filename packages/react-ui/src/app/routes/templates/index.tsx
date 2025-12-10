import { t } from 'i18next';
import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProjectDashboardPageHeader } from '@/app/components/project-layout/project-dashboard-page-header';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { useTemplates } from '@/features/templates/hooks/templates-hook';
import { userHooks } from '@/hooks/user-hooks';
import {
  PlatformRole,
  Template,
  TemplateType,
  TemplateCategory,
} from '@activepieces/shared';

import { AllCategoriesView } from './all-categories-view';
import { CategoryFilterCarousel } from './category-filter-carousel';
import { EmptyTemplatesView } from './empty-templates-view';
import { SelectedCategoryView } from './selected-category-view';
import {
  AllCategoriesViewSkeleton,
  SelectedCategoryViewSkeleton,
} from './skeletons';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, isLoading, search, setSearch, category, setCategory } =
    useTemplates(TemplateType.OFFICIAL);
  const selectedCategory = category as TemplateCategory | 'All';
  const { data: user } = userHooks.useCurrentUser();
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleTemplateSelect = (template: Template) => {
    navigate(`/templates/${template.id}`);
  };

  const categories: (TemplateCategory | 'All')[] = [
    'All',
    ...Object.values(TemplateCategory),
  ];

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<TemplateCategory, Template[]> = {} as Record<
      TemplateCategory,
      Template[]
    >;

    Object.values(TemplateCategory).forEach((category) => {
      grouped[category] = [];
    });

    templates?.forEach((template) => {
      template.categories?.forEach((category) => {
        if (grouped[category]) {
          grouped[category].push(template);
        }
      });
    });

    return grouped;
  }, [templates]);

  const selectedCategoryTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    return templatesByCategory[selectedCategory] || [];
  }, [selectedCategory, templates, templatesByCategory]);

  return (
    <div>
      <ProjectDashboardPageHeader title={t('Templates')} />
      <div>
        <div className="mb-6">
          <InputWithIcon
            icon={<Search className="w-4 h-4" />}
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={t('Search templates')}
          />
          <CategoryFilterCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setCategory}
          />
        </div>

        {isLoading ? (
          <>
            {selectedCategory === 'All' ? (
              <AllCategoriesViewSkeleton />
            ) : (
              <SelectedCategoryViewSkeleton />
            )}
          </>
        ) : (
          <>
            {templates?.length === 0 && (
              <EmptyTemplatesView
                search={search}
                isPlatformAdmin={isPlatformAdmin}
              />
            )}

            {templates && templates.length > 0 && (
              <>
                {selectedCategory === 'All' ? (
                  <AllCategoriesView
                    templatesByCategory={templatesByCategory}
                    onCategorySelect={setCategory}
                    onTemplateSelect={handleTemplateSelect}
                  />
                ) : (
                  <SelectedCategoryView
                    category={selectedCategory}
                    templates={selectedCategoryTemplates}
                    onTemplateSelect={handleTemplateSelect}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export { TemplatesPage };
