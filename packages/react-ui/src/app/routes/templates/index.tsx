import { t } from 'i18next';
import { Plus, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar-shadcn';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import {
  Template,
  TemplateType,
  TemplateCategory,
  UncategorizedFolderId,
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
    templatesHooks.useTemplates(TemplateType.OFFICIAL);
  const selectedCategory = category as TemplateCategory | 'All';
  const { data: allTemplates, isLoading: isAllTemplatesLoading } =
    templatesHooks.useAllOfficialTemplates();
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleTemplateSelect = (template: Template) => {
    navigate(`/templates/${template.id}`);
  };

  const templatesByCategory = useMemo(() => {
    const grouped: Record<TemplateCategory, Template[]> = {} as Record<
      TemplateCategory,
      Template[]
    >;

    Object.values(TemplateCategory).forEach((category) => {
      grouped[category] = [];
    });

    allTemplates?.forEach((template: Template) => {
      if (template.categories?.length) {
        template.categories?.forEach((category: TemplateCategory) => {
          if (grouped[category]) {
            grouped[category].push(template);
          }
        });
      }
    });

    return grouped;
  }, [allTemplates]);

  const categories: (TemplateCategory | 'All')[] = useMemo(() => {
    const categoriesWithTemplates = Object.values(TemplateCategory).filter(
      (category) => templatesByCategory[category]?.length > 0,
    );
    return ['All', ...categoriesWithTemplates];
  }, [templatesByCategory]);

  const selectedCategoryTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    return templatesByCategory[selectedCategory] || [];
  }, [selectedCategory, templates, templatesByCategory]);

  return (
    <div>
      <div>
        <div className="sticky top-0 z-10 bg-background mb-6 pt-4">
          <div className="flex flex-row w-full justify-between gap-2">
            <SidebarTrigger />
            <InputWithIcon
              icon={<Search className="text-gray-500 w-4 h-4" />}
              type="text"
              value={search}
              onChange={handleSearchChange}
              className="bg-sidebar-accent w-[50%]"
              placeholder={t('Search templates by name or description')}
            />
            <div className="flex flex-row justify-end w-[50%]">
              <Button
                variant="outline"
                className="gap-2 h-full"
                onClick={() => createFlow()}
                disabled={isCreateFlowPending}
              >
                <Plus className="w-4 h-4" />
                {t('Start from scratch')}
              </Button>
            </div>
          </div>
          {!isAllTemplatesLoading && (
            <CategoryFilterCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setCategory}
            />
          )}
        </div>

        {isLoading || isAllTemplatesLoading ? (
          <>
            {selectedCategory === 'All' ? (
              <AllCategoriesViewSkeleton />
            ) : (
              <SelectedCategoryViewSkeleton />
            )}
          </>
        ) : (
          <>
            {templates?.length === 0 && <EmptyTemplatesView />}

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
