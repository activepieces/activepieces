import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AppearanceSection } from '@/app/routes/platform/setup/branding/appearance-section';
import { CustomDomainsCard } from '@/app/routes/platform/setup/branding/custom-domain-section';
import { SmtpSection } from '@/app/routes/platform/setup/branding/smtp-section';
import { platformHooks } from '@/hooks/platform-hooks';

export const BrandingPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      featureKey="BRANDING"
      locked={!platform.customAppearanceEnabled}
      lockTitle={t('Brand Activepieces')}
      lockDescription={t(
        'Give your users an experience that looks like you by customizing the color, logo and more',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/appearance.mp4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold w-full">{t('Branding')}</h1>
          <span className="text-sm text-muted-foreground max-w-[500px]">
            {t('Configure the appearance and SMTP settings for your platform.')}
          </span>
        </div>
        <SmtpSection />
        <CustomDomainsCard />
        <AppearanceSection />
      </div>
    </LockedFeatureGuard>
  );
};
