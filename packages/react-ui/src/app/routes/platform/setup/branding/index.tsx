import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AppearanceSection } from '@/app/routes/platform/setup/branding/appearance-section';
import { CustomDomainsCard } from '@/app/routes/platform/setup/branding/custom-domain-section';
import { SmtpSection } from '@/app/routes/platform/setup/branding/smtp-section';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { platformHooks } from '@/hooks/platform-hooks';

export const BrandingPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      featureKey="BRANDING"
      locked={!platform.plan.customAppearanceEnabled}
      lockTitle={t('Brand Activepieces')}
      lockDescription={t(
        'Give your users an experience that looks like you by customizing the color, logo and more',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/appearance.mp4"
    >
      <div className="w-full flex flex-col gap-4">
        <DashboardPageHeader
          title={t('Branding')}
          description={t(
            'Configure the appearance and SMTP settings for your platform.',
          )}
        />
        <SmtpSection />
        <CustomDomainsCard />
        <AppearanceSection />
      </div>
    </LockedFeatureGuard>
  );
};
