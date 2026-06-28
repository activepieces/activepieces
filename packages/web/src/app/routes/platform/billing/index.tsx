import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  FeatureUsageCards,
  LicenseKey,
  SubscriptionInfo,
  billingMutations,
  billingQueries,
  useManagePlanDialogStore,
} from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function Billing() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={t('Unlock Billing Page')}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      lockDocumentationUrl="https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional"
      showContactSales={false}
    >
      <BillingPageDetails />
    </LockedFeatureGuard>
  );
}

function BillingPageDetails() {
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const { mutate: redirectToPortalSession } = billingMutations.usePortalLink();
  const { mutate: reactivateSubscription, isPending: isReactivating } =
    billingMutations.useReactivateSubscription();
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const hasBillingPortal = (platformPlanInfo?.nextBillingAmount ?? 0) > 0;

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        {t('Failed to load billing information')}
      </article>
    );
  }

  return (
    <CenteredPage
      title={t('Billing')}
      description={t(
        'For questions about billing contact us at support@activepieces.com',
      )}
    >
      <div className="flex flex-col gap-6">
        {!isCommunity && <SubscriptionInfo info={platformPlanInfo} />}

        {!isCommunity && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => openManagePlanDialog()}
            >
              {t('Manage Plan')}
            </Button>
            {hasBillingPortal && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => redirectToPortalSession()}
              >
                {t('Access Billing Portal')}
              </Button>
            )}
            {!isNil(platformPlanInfo.cancelAt) && (
              <Button
                variant="default"
                size="sm"
                className="w-fit"
                disabled={isReactivating}
                onClick={() => reactivateSubscription()}
              >
                {t('Keep current plan')}
              </Button>
            )}
          </div>
        )}

        {!isCommunity && (
          <FeatureUsageCards platformSubscription={platformPlanInfo} />
        )}
        <LicenseKey platform={platform} />
      </div>
    </CenteredPage>
  );
}
