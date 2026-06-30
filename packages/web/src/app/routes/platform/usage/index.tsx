import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Separator } from '@/components/ui/separator';
import { FeatureUsageCards, billingQueries } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function Usage() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={t('Unlock Usage Page')}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      lockDocumentationUrl="https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional"
      showContactSales={false}
    >
      <UsagePageDetails />
    </LockedFeatureGuard>
  );
}

function UsagePageDetails() {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: info,
    isLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  if (isLoading || isNil(info)) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        {t('Failed to load usage information')}
      </article>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">{t('Usage')}</h1>
        <div className="text-sm text-muted-foreground">
          {t('Track your workspace usage across your plan limits.')}
        </div>
      </div>
      <Separator />
      <FeatureUsageCards platformSubscription={info} />
    </div>
  );
}
