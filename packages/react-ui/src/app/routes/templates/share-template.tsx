import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { FullLogo } from '@/components/ui/full-logo';
import { ShareTemplate } from '@/features/templates/components/share-template';

const ShareTemplatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  if (!templateId) {
    return <div>{t('templateId is missing')}</div>;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
      <FullLogo />
      <ShareTemplate templateId={templateId} />
    </div>
  );
};

export { ShareTemplatePage };
