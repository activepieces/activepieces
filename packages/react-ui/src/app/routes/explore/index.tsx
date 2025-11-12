import { t } from 'i18next';
import { ArrowLeft, Search, SearchX } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { InputWithIcon } from '@/components/custom/input-with-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TemplateCard } from '@/features/templates/components/template-card';
import { TemplateDetailsView } from '@/features/templates/components/template-details-view';
import { useTemplates } from '@/features/templates/hooks/templates-hook';
import { FlowTemplate } from '@activepieces/shared';

export const ExplorePage = () => {
  const { filteredTemplates, isLoading, search, setSearch } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(
    null,
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const unselectTemplate = () => {
    setSelectedTemplate(null);
  };

  return (
    <>
      <DashboardPageHeader
        title={t('Explore Templates')}
        description={t('Browse and use pre-built flow templates')}
      />
      <div className="px-4">
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
              <div className="flex flex-col items-center justify-center gap-2 text-center min-h-[300px]">
                <SearchX className="w-10 h-10" />
                {t('No templates found, try adjusting your search')}
              </div>
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
    </>
  );
};
