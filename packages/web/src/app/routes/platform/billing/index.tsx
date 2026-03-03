import {
  ApSubscriptionStatus,
  AiCreditsAutoTopUpState,
  ApEdition,
  ApFlagId,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';


import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  ActiveFlowAddon,
  AICreditUsage,
  LicenseKey,
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
        'Upgrade to the Enterprise edition to access billing and usage management.',
      )}
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
  const status = platformPlanInfo?.plan?.stripeSubscriptionStatus;
  const isSubscriptionActive =
    ApSubscriptionStatus.ACTIVE === (status as ApSubscriptionStatus);

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
        {isSubscriptionActive && <SubscriptionInfo info={platformPlanInfo} />}

        {(isSubscriptionActive ||
          platformPlanInfo?.plan.aiCreditsAutoTopUpState ===
            AiCreditsAutoTopUpState.ENABLED) && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => redirectToPortalSession()}
          >
            {t('Access Billing Portal')}
          </Button>
        )}

        {!isCommunity && (
          <>
            <ActiveFlowAddon platformSubscription={platformPlanInfo} />
            <AICreditUsage platformSubscription={platformPlanInfo} />
          </>
        )}
        <LicenseKey platform={platform} />
      </div>
    </CenteredPage>
  );
}
