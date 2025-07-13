import { t } from 'i18next';
import { useState } from 'react';

import { TableTitle } from '@/components/custom/table-title';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import { AICreditUsage } from '@/features/billing/components/ai-credit-usage';
import { BusinessUserSeats } from '@/features/billing/components/business-user-seats';
import { LicenseKey } from '@/features/billing/components/lisence-key';
import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import { TasksUsage } from '@/features/billing/components/tasks-usage';
import { UsageCards } from '@/features/billing/components/usage-cards';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

export default function Billing() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [managePlanOpen, setManagePlanOpen] = useState(false);

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  const { mutate: redirectToPortalSession } = billingMutations.usePortalLink();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const status = platformPlanInfo?.plan?.stripeSubscriptionStatus;
  const isSubscriptionActive = [ApSubscriptionStatus.ACTIVE].includes(
    status as ApSubscriptionStatus,
  );
  const isBusinessPlan = platformPlanInfo?.plan.plan === PlanName.BUSINESS;
  const isEnterprise =
    !isNil(platformPlanInfo?.plan.licenseKey) ||
    edition === ApEdition.ENTERPRISE;

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <article className="flex flex-col w-full gap-8">
        <TableTitle>Billing</TableTitle>
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="flex flex-col w-full gap-8">
        <TableTitle>Billing</TableTitle>
        <div className="flex items-center justify-center h-[400px] text-destructive">
          {t('Failed to load billing information')}
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col w-full gap-8">
      <div className="flex justify-between items-center">
        <div>
          <TableTitle>{t('Billing')}</TableTitle>
          <p className="text-sm text-muted-foreground">
            {t('Manage billing, usage and limits')}
          </p>
        </div>

        {!isEnterprise && (
          <div className="flex items-center gap-2">
            {isSubscriptionActive && (
              <Button
                variant="outline"
                onClick={() => redirectToPortalSession()}
              >
                {t('Access Billing Portal')}
              </Button>
            )}
            <Button variant="default" onClick={() => setManagePlanOpen(true)}>
              {t('Upgrade Plan')}
            </Button>
          </div>
        )}
      </div>

      {!isEnterprise && <SubscriptionInfo info={platformPlanInfo} />}

      <UsageCards platformSubscription={platformPlanInfo} />
      {isBusinessPlan && (
        <BusinessUserSeats platformSubscription={platformPlanInfo} />
      )}
      <AICreditUsage platformSubscription={platformPlanInfo} />
      <TasksUsage platformSubscription={platformPlanInfo} />

      {isEnterprise && <LicenseKey />}

      <ManagePlanDialog open={managePlanOpen} setOpen={setManagePlanOpen} />
    </article>
  );
}
