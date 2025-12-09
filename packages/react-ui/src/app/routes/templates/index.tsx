import { t } from 'i18next';
import { ArrowLeft, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

import { ProjectDashboardPageHeader } from '@/app/components/project-layout/project-dashboard-page-header';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateDetailsView } from '@/features/templates/components/template-details-view';
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
  const { templates, isLoading, search, setSearch, category, setCategory } =
    useTemplates(TemplateType.OFFICIAL);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const selectedCategory = category as TemplateCategory | 'All';
  const { data: user } = userHooks.useCurrentUser();
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const unselectTemplate = () => {
    setSelectedTemplate(null);
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
                    onTemplateSelect={setSelectedTemplate}
                  />
                ) : (
                  <SelectedCategoryView
                    category={selectedCategory}
                    templates={selectedCategoryTemplates}
                    onTemplateSelect={setSelectedTemplate}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={unselectTemplate}>
        <DialogContent className="lg:min-w-[850px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex min-h-9 flex-row items-center justify-start gap-2 items-center h-full">
              <Button variant="ghost" size="sm" onClick={unselectTemplate}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {t('Template Details')}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <DialogDescription>
              <TemplateDetailsView template={selectedTemplate} />
            </DialogDescription>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { TemplatesPage };
