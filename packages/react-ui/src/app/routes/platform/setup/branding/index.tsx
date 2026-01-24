import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AppearanceSection } from '@/app/routes/platform/setup/branding/appearance-section';
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
          description={t('Configure the appearance for your platform.')}
        />
        <AppearanceSection />
      </div>
    </LockedFeatureGuard>
  );
};
