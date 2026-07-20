import { t } from 'i18next';
import { Navigate, useNavigate } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { TemplateDetailsPage } from '@/app/routes/templates/id';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { templatesHooks } from '@/features/templates';

// The template details "page" hosted in a dialog over the templates gallery.
// The URL (/templates/:templateId) drives it: closing navigates back to
// /templates, which unmounts it while the gallery underneath stays mounted.
export function TemplateDetailsDialog({ templateId }: { templateId: string }) {
  const navigate = useNavigate();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId);

  if (!isLoading && !template) {
    return <Navigate to="/templates" replace />;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          navigate('/templates');
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[92vw] max-w-6xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">
          {template?.name ?? t('Templates')}
        </DialogTitle>
        {isLoading || !template ? (
          <LoadingScreen mode="container" />
        ) : (
          <PageTitle title={template.name}>
            <TemplateDetailsPage template={template} />
          </PageTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}
