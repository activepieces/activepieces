import { useParams } from 'react-router-dom';
import { t } from 'i18next';
import { ShareTemplate } from '@/features/templates/components/share-template';
import { theme } from '@/lib/theme';

const ShareTemplatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();

  if (!templateId) {
    return <div>{t('Error: templateId is missing')}</div>;
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2">
      <img src={theme.fullLogoUrl} alt={t('logo')} width={205} height={205} />
      <ShareTemplate templateId={templateId} />
    </div>
  );
};

export { ShareTemplatePage };