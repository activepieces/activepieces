import { t } from 'i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { FullLogo } from '@/components/ui/full-logo';
import { ShareTemplate } from '@/features/templates/components/share-template';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';
import { isNil } from '@activepieces/shared';

const ShareTemplatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const token = authenticationSession.getToken();
  const location = useLocation();

  if (!templateId) {
    return <div>{t('templateId is missing')}</div>;
  }

  if (isNil(token)) {
    return (
      <Navigate
        to={`/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`}
        replace
      />
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ShareTemplate templateId={templateId} />
    </div>
  );
};

export { ShareTemplatePage };
