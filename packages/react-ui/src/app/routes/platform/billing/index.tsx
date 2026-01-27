import { t } from 'i18next';
import { Wand } from 'lucide-react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ActiveFlowAddon } from '@/features/billing/components/active-flows-addon';
import { AICreditUsage } from '@/features/billing/components/ai-credits/ai-credit-usage';
import { FeatureStatus } from '@/features/billing/components/features-status';
import { LicenseKey } from '@/features/billing/components/license-key';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';
import {
  AiCreditsAutoTopUpState,
  ApEdition,
  ApFlagId,
  isNil,
} from '@activepieces/shared';

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

const BillingPageDetails = () => {
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
    <>
      <DashboardPageHeader
        title={t('Billing')}
        description={t('Manage billing, usage and limits')}
      >
        <div className="flex items-center gap-2">
          {(isSubscriptionActive ||
            platformPlanInfo?.plan.aiCreditsAutoTopUpState ===
              AiCreditsAutoTopUpState.ENABLED) && (
            <Button variant="outline" onClick={() => redirectToPortalSession()}>
              {t('Access Billing Portal')}
            </Button>
          )}
        </div>
      </DashboardPageHeader>

      <section className="flex flex-col w-full gap-6">
        {isSubscriptionActive && <SubscriptionInfo info={platformPlanInfo} />}

        {!isCommunity ? (
          <>
            <ActiveFlowAddon platformSubscription={platformPlanInfo} />
            <AICreditUsage platformSubscription={platformPlanInfo} />
            <LicenseKey platform={platform} />
          </>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
                    <Wand className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t('Enabled Features')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'The following features are currently enabled as part of your platform plan.',
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <FeatureStatus platform={platform} />
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
};
