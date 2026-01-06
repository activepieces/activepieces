import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { ProjectDashboardLayout } from '@/app/components/project-layout';
import { TemplateDetailsPage } from '@/app/routes/templates/id';
import { SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import { TemplateType } from '@activepieces/shared';

const TemplateDetailsWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId!);

  const useProjectLayout =
    !isLoading && template && template.type !== TemplateType.SHARED;
  const pageTitle = template?.name || t('Template Details');

  const content = (
    <PageTitle title={pageTitle}>
      <TemplateDetailsPage />
    </PageTitle>
  );

  if (useProjectLayout) {
    return <ProjectDashboardLayout>{content}</ProjectDashboardLayout>;
  }

  return <SidebarProvider>{content}</SidebarProvider>;
};

export { TemplateDetailsWrapper };
