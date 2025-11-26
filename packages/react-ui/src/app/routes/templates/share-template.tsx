import { t } from 'i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { FullLogo } from '@/components/ui/full-logo';
import { ShareTemplate } from '@/features/templates/components/share-template';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';
import { isNil } from '@activepieces/shared';

const ShareTemplatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const token = authenticationSession.getToken();
  const navigate = useNavigate();
  const location = useLocation();

  if (!templateId) {
    return <div>{t('templateId is missing')}</div>;
  }

  if (isNil(token)) {
    const currentPath = `${location.pathname}${location.search}`;
    navigate(`/sign-in?${FROM_QUERY_PARAM}=${encodeURIComponent(currentPath)}`);
    return;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ShareTemplate templateId={templateId} />
    </div>
  );
};

export { ShareTemplatePage };
