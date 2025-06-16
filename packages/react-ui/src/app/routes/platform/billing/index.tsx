import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TableTitle } from '@/components/ui/table-title';
import { AICreditUsage } from '@/features/billing/components/ai-credit-usage';
import { BusinessUserSeats } from '@/features/billing/components/business-user-seats';
import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';
import { TasksUsage } from '@/features/billing/components/tasks-usage';
import { UsageCards } from '@/features/billing/components/usage-cards';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

export default function Billing() {
  const { platform } = platformHooks.useCurrentPlatform();
  const [managePlanOpen, setManagePlanOpen] = useState(false);

  const {
    data: platformSubscription,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  const { mutate: getPortalLink } = billingMutations.usePortalLink();

  const isSubscriptionActive =
    platformSubscription?.plan.stripeSubscriptionStatus ===
    ApSubscriptionStatus.ACTIVE;
  const isBusinessPlan = platformSubscription?.plan.plan === PlanName.BUSINESS;

  if (isPlatformSubscriptionLoading || isNil(platformSubscription)) {
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
          <TableTitle>Billing</TableTitle>
          <p className="text-sm text-muted-foreground">
            Manage billing, usage and limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSubscriptionActive && (
            <Button variant="outline" onClick={() => getPortalLink()}>
              {t('Access Billing Portal')}
            </Button>
          )}
          <Button variant="default" onClick={() => setManagePlanOpen(true)}>
            {t('Upgrade')}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm flex items-center gap-1">
          <span>{t('Current Plan')}</span>
          <Badge variant="secondary">
            {isNil(platformSubscription.plan.plan)
              ? t('Free')
              : platformSubscription?.plan.plan.charAt(0).toUpperCase() +
                platformSubscription?.plan.plan.slice(1)}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold">
            ${platformSubscription.nextBillingAmount || Number(0).toFixed(2)}
          </div>
          <div className="text-xl text-muted-foreground">/month</div>
        </div>
        {platformSubscription?.nextBillingDate &&
          isNil(platformSubscription.cancelAt) && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>
                Resets{' '}
                {dayjs(platformSubscription.nextBillingDate).format(
                  'MMM D, YYYY',
                )}
              </span>
            </div>
          )}

        {platformSubscription?.cancelAt && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span>
              Cancels at{' '}
              {dayjs(platformSubscription.cancelAt).format('MMM D, YYYY')}
            </span>
          </div>
        )}
      </div>

      <UsageCards platformSubscription={platformSubscription} />
      {isBusinessPlan && (
        <BusinessUserSeats platformSubscription={platformSubscription} />
      )}
      <AICreditUsage platformSubscription={platformSubscription} />
      <TasksUsage platformSubscription={platformSubscription} />

      <ManagePlanDialog open={managePlanOpen} setOpen={setManagePlanOpen} />
    </article>
  );
}
