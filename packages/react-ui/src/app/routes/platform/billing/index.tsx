import { t } from 'i18next';
import { Wand } from 'lucide-react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ActiveFlowAddon } from '@/features/billing/components/active-flows-addon';
import { AICreditUsage } from '@/features/billing/components/ai-credit-usage';
import { AiCreditsUsageTable } from '@/features/billing/components/ai-credits-usage-table';
import { FeatureStatus } from '@/features/billing/components/features-status';
import { LicenseKey } from '@/features/billing/components/lisence-key';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';
import { ApEdition, ApFlagId, isNil, PlanName } from '@activepieces/shared';

export default function Billing() {
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  const { mutate: redirectToPortalSession } = billingMutations.usePortalLink();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const status = platformPlanInfo?.plan?.stripeSubscriptionStatus;
  const isSubscriptionActive =
    ApSubscriptionStatus.ACTIVE === (status as ApSubscriptionStatus);
  const isEnterprise =
    !isNil(platformPlanInfo?.plan.licenseKey) ||
    platformPlanInfo?.plan.plan === PlanName.ENTERPRISE ||
    edition === ApEdition.ENTERPRISE;

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
          {!isEnterprise && isSubscriptionActive && (
            <Button variant="outline" onClick={() => redirectToPortalSession()}>
              {t('Access Billing Portal')}
            </Button>
          )}
        </div>
      </DashboardPageHeader>

      <section className="flex flex-col w-full gap-6">
        {!isEnterprise && isSubscriptionActive && (
          <SubscriptionInfo info={platformPlanInfo} />
        )}

        <ActiveFlowAddon platformSubscription={platformPlanInfo} />

        {!isEnterprise && (
          <AICreditUsage platformSubscription={platformPlanInfo} />
        )}

        {isEnterprise && (
          <>
            <h3 className="text-lg font-semibold">{t('AI Credits')}</h3>
            <AiCreditsUsageTable />
          </>
        )}

        {isEnterprise ? (
          <LicenseKey platform={platform} isEnterprise={isEnterprise} />
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
}
