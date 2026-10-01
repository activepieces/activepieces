import { PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';

import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

export function UsageTab({ platform, info }: UsageTabProps) {
  return (
    <Page>
      <PageHeader
        title={t('Usage')}
        description={t(
          'What this platform has used of its plan, and which projects spent the credits. Figures can be a few minutes behind.',
        )}
      />
      <PageSection title={t('Usage this period')}>
        <FeatureUsageCards platformSubscription={info} />
      </PageSection>
      <ProjectsUsageTable platformId={platform.id} />
    </Page>
  );
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
