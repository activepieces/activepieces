import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AppearanceSection } from '@/app/routes/platform/setup/branding/appearance-section';
import { platformHooks } from '@/hooks/platform-hooks';
import { apHostedAssetUrl } from '@/lib/ap-hosted-asset-url';

export const BrandingPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      featureKey="BRANDING"
      locked={!platform.plan.customAppearanceEnabled}
      lockTitle={t('Brand otom8')}
      lockDescription={t(
        'Customize your organization name, color, logo, and favicon.',
      )}
      lockVideoUrl={
        apHostedAssetUrl(
          'https://cdn.activepieces.com/videos/showcase/appearance.mp4',
        ) ??
        'https://cdn.activepieces.com/videos/showcase/appearance.mp4'
      }
    >
      <CenteredPage
        title={t('Branding')}
        description={t('Configure the appearance for your organization.')}
      >
        <AppearanceSection />
      </CenteredPage>
    </LockedFeatureGuard>
  );
};
