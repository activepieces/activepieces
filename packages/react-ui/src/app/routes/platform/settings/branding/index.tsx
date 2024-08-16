import { AppearanceSection } from '@/app/routes/platform/settings/branding/appearance-section';
import { SmtpSection } from '@/app/routes/platform/settings/branding/smtp-section';
import { t } from 'i18next';

export const BrandingPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1>{t('Branding')}</h1>
      <p>{t('Configure the appearance and SMTP settings for your platform.')}</p>
      <AppearanceSection />
      <SmtpSection />
    </div>
  );
};