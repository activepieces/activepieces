import { t } from 'i18next';
import { Navigate, useParams } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { ProjectDashboardLayout } from '@/app/components/project-layout';
import { TemplateDetailsPage } from '@/app/routes/templates/id';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { determineDefaultRoute } from '@/lib/utils';
import { TemplateType } from '@activepieces/shared';

const TemplateDetailsWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId!);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);

  const useProjectLayout =
    !isLoading && template && template.type !== TemplateType.SHARED;
  const pageTitle = template?.name || t('Template Details');

  const content = (
    <PageTitle title={pageTitle}>
      <TemplateDetailsPage template={template!} />
    </PageTitle>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!template) {
    return <Navigate to={defaultRoute} replace />;
  }

  if (useProjectLayout) {
    return <ProjectDashboardLayout>{content}</ProjectDashboardLayout>;
  }

  return <SidebarProvider>{content}</SidebarProvider>;
};

export { TemplateDetailsWrapper };
