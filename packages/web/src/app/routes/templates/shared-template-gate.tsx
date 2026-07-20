import { TemplateType } from '@activepieces/shared';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { ShareTemplate, templatesHooks } from '@/features/templates';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

// The logged-out path of /templates/:templateId: shared templates are public
// and render standalone; anything else requires signing in first.
export function SharedTemplateGate() {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!template) {
    return <Navigate to="/templates" replace />;
  }

  if (template.type === TemplateType.SHARED) {
    return <ShareTemplate template={template} />;
  }

  return (
    <Navigate
      to={`/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`}
      replace
    />
  );
}
