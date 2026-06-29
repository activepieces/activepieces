import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  FeatureUsageCards,
  LicenseKey,
  PlanSelector,
  SubscriptionInfo,
  billingMutations,
  billingQueries,
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
  const { mutate: redirectToPortalSession, isPending: isOpeningPortal } =
    billingMutations.usePortalLink();
  const { mutate: reactivateSubscription, isPending: isReactivating } =
    billingMutations.useReactivateSubscription();
  const hasBillingPortal = platformPlanInfo?.billingPortalAvailable ?? false;

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

  const showActions =
    !isCommunity && (hasBillingPortal || !isNil(platformPlanInfo.cancelAt));

  return (
    <CenteredPage
      widthClassName="max-w-[56rem]"
      title={t('Billing')}
      description={t(
        'For questions about billing contact us at support@activepieces.com',
      )}
    >
      <div className="flex flex-col gap-6">
        {!isCommunity && <SubscriptionInfo info={platformPlanInfo} />}

        {showActions && (
          <div className="flex items-center gap-2">
            {hasBillingPortal && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={isOpeningPortal}
                onClick={() => redirectToPortalSession()}
              >
                {isOpeningPortal && (
                  <Loader2 className="size-4 animate-spin mr-2" />
                )}
                {t('Billing history & payment')}
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
          <section id="billing-plans" className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">{t('Plans')}</h2>
            <PlanSelector enabled={true} />
          </section>
        )}

        {!isCommunity && (
          <FeatureUsageCards platformSubscription={platformPlanInfo} />
        )}

        <LicenseKey platform={platform} />
      </div>
    </CenteredPage>
  );
}
