import {
  Template,
  TemplateTelemetryEventType,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page, PageHeader } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { templatesTelemetryApi, templatesHooks } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';

import { AllCategoriesView } from './all-categories-view';
import { CategoryFilterCarousel } from './category-filter-carousel';
import { EmptyTemplatesView } from './empty-templates-view';
import { SelectedCategoryView } from './selected-category-view';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { data: templateCategories } = templatesHooks.useTemplateCategories();
  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;
  const { templates, isLoading, search, setSearch, category, setCategory } =
    templatesHooks.useTemplates(
      isShowingOfficialTemplates ? TemplateType.OFFICIAL : TemplateType.CUSTOM,
    );
  const selectedCategory = category as string;
  const { data: allOfficialTemplates, isLoading: isAllTemplatesLoading } =
    templatesHooks.useAllOfficialTemplates();
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      navigate(`/templates/${template.id}`);
      if (template.type === TemplateType.OFFICIAL) {
        templatesTelemetryApi.sendEvent({
          eventType: TemplateTelemetryEventType.VIEW,
          templateId: template.id,
        });
      }
    },
    [navigate],
  );

  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, Template[]> = {} as Record<
      string,
      Template[]
    >;

    if (isShowingOfficialTemplates) {
      allOfficialTemplates?.forEach((template: Template) => {
        if (template.categories?.length) {
          template.categories?.forEach((category: string) => {
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(template);
          });
        }
      });
    }

    return grouped;
  }, [allOfficialTemplates, isShowingOfficialTemplates]);

  const categories = useMemo(() => {
    return ['All', ...(templateCategories || [])];
  }, [templateCategories]);

  const selectedCategoryTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    return templatesByCategory[selectedCategory] || [];
  }, [selectedCategory, templates, templatesByCategory]);

  const showLoading =
    isLoading || (isShowingOfficialTemplates && isAllTemplatesLoading);
  const showAllCategories =
    isShowingOfficialTemplates && selectedCategory === 'All';
  const hasTemplates = templates && templates.length > 0;
  const showCategoryTitleForOfficialTemplates =
    isShowingOfficialTemplates && selectedCategory !== 'All';

  return (
    <Page>
      <PageHeader title={t('Explore')}>
        <Button onClick={() => createFlow()} disabled={isCreateFlowPending}>
          <Plus />
          {t('Start from scratch')}
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-2">
        <div className="max-w-md">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder={t('Search templates by name or description')}
          />
        </div>
        {isShowingOfficialTemplates && categories && (
          <CategoryFilterCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setCategory}
          />
        )}
      </div>

      {!hasTemplates && !showLoading ? (
        <EmptyTemplatesView />
      ) : showAllCategories ? (
        <AllCategoriesView
          templatesByCategory={templatesByCategory}
          categories={categories}
          onCategorySelect={setCategory}
          onTemplateSelect={handleTemplateSelect}
          isLoading={showLoading}
          hideHeader={!isShowingOfficialTemplates}
        />
      ) : (
        <SelectedCategoryView
          category={selectedCategory}
          templates={selectedCategoryTemplates}
          onTemplateSelect={handleTemplateSelect}
          isLoading={showLoading}
          showCategoryTitle={showCategoryTitleForOfficialTemplates}
        />
      )}
    </Page>
  );
};

export { TemplatesPage };
