import { t } from 'i18next';
import { ArrowLeft, Search, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TemplateCard } from '@/features/templates/components/template-card';
import { TemplateDetailsView } from '@/features/templates/components/template-details-view';
import { useTemplates } from '@/features/templates/hooks/templates-hook';
import { userHooks } from '@/hooks/user-hooks';
import { PlatformRole, Template, TemplateType } from '@activepieces/shared';

export const ExplorePage = () => {
  const { filteredTemplates, isLoading, search, setSearch } = useTemplates({
    type: TemplateType.OFFICIAL,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const { data: user } = userHooks.useCurrentUser();
  const navigate = useNavigate();
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const unselectTemplate = () => {
    setSelectedTemplate(null);
  };

  return (
    <div>
      <ProjectDashboardPageHeader title={t('Explore Templates')} />
      <div>
        <div className="mb-4">
          <InputWithIcon
            icon={<Search className="w-4 h-4" />}
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={t('Search templates')}
          />
        </div>

        {isLoading ? (
          <div className="min-h-[300px] flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {filteredTemplates?.length === 0 && (
              <Empty className="min-h-[300px]">
                <EmptyHeader className="max-w-xl">
                  <EmptyMedia variant="icon">
                    <SearchX />
                  </EmptyMedia>
                  <EmptyTitle>{t('No templates found')}</EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? t(
                          'No templates match your search criteria. Try adjusting your search terms.',
                        )
                      : t('No templates are available at the moment.')}
                  </EmptyDescription>
                </EmptyHeader>
                {!search && isPlatformAdmin && (
                  <EmptyContent>
                    <Button
                      onClick={() => navigate('/platform/setup/templates')}
                    >
                      {t('Setup Templates')}
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredTemplates?.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelectTemplate={(template) => {
                    setSelectedTemplate(template);
                  }}
                />
              ))}
            </div>
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
