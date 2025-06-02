import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  ClipboardCheck,
  Sparkles,
  CircleHelp,
  CalendarDays,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';
import { UsageCards } from '@/features/billing/components/usage-cards';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { calculateTotalCost } from '@/features/billing/lib/utils';
import { platformHooks } from '@/hooks/platform-hooks';
import { useDialogStore } from '@/lib/dialogs-store';
import { isNil } from '@activepieces/shared';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';

export default function Billing() {
  const { setDialog } = useDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformSubscription,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);
  const { mutate: getPortalLink } = billingMutations.usePortalLink();

  const isSubscriptionActive = platformSubscription?.plan.stripeSubscriptionStatus === ApSubscriptionStatus.ACTIVE

  const calculatedTotalCost = calculateTotalCost(
    platformSubscription?.usage.tasks || 0,
    platformSubscription?.plan.tasksLimit || 0,
  );

  const tasksLimit = platformSubscription?.plan.tasksLimit ?? 0;
  const aiLimit = platformSubscription?.plan.aiCreditsLimit ?? 0;

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
          {/* TODO: add payment method or acess billing portal */}
          {isSubscriptionActive && (
            <Button variant="outline" onClick={() => getPortalLink()}>
              {t('Access Billing Portal')}
            </Button>
          )}
          <Button
            variant="default"
            onClick={() => setDialog('managePlan', true)}
          >
            {t('Upgrade')}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>{t('Current Plan')}</span>
          <span>{platformSubscription?.plan.plan || t('Free')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold">{calculatedTotalCost}</div>
          <div className="text-xl text-muted-foreground">/month</div>
        </div>
        {platformSubscription?.nextBillingDate && (
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
      </div>

      <UsageCards platformSubscription={platformSubscription} />

      <Card>
        <CardHeader className="border-b border-gray-300">
          <div className="text-md font-sm flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            {t('Tasks')}
          </div>
        </CardHeader>
        <CardContent className="p-4 mt-5">
          <div className="flex gap-2 items-center">
            <div className="text-sm font-sm mt-1 flex items-center gap-2 basis-1/3 flex-wrap">
              <div className="flex items-center gap-1 w-full">
                {t('Current Task Usage')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Count of executed steps')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-sm font-sm text-gray-500">
                {t(
                  `First ${
                    platformSubscription?.plan?.includedTasks || 1000
                  } tasks free`,
                )}
              </div>
            </div>
            <div className="basis-2/3">
              <Progress
                value={platformSubscription?.usage.tasks || 0}
                limit={tasksLimit ?? 0}
                label={t('Billing Limit')}
              />
            </div>
          </div>
          <div className="text-sm mt-5 flex items-center gap-1">
            {(tasksLimit || 0) > 0 ? (
              <div className="flex items-center gap-1">
                {t(`Your tasks limit is set to ${tasksLimit}`)}
              </div>
            ) : null}
            {isSubscriptionActive ? (
              <Button
                variant="link"
                onClick={() => setDialog('editTasksLimit', true)}
                size="sm"
              >
                {tasksLimit ? t('Edit') : t('Add Limit')}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-300">
          <div className="text-md font-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('AI Credits')}
          </div>
        </CardHeader>
        <CardContent className="p-4 mt-5">
          <div className="flex gap-2 items-center">
            <div className="text-sm font-sm mt-1 flex items-center gap-2 basis-1/3 flex-wrap">
              <div className="flex items-center gap-1 w-full">
                {t('Current Credit Usage')}
              </div>
              <div className="text-sm font-sm text-gray-500">
                {t(
                  `First ${
                    platformSubscription?.plan?.includedAiCredits || 200
                  } credits free`,
                )}
              </div>
            </div>
            <div className="basis-2/3">
              <Progress
                value={platformSubscription?.usage.aiCredits || 0}
                limit={aiLimit ?? 0}
                label={t('Billing Limit')}
              />
            </div>
          </div>
          <div className="text-sm mt-5 flex items-center gap-1">
            {(aiLimit || 0) > 0 ? (
              <div className="flex items-center gap-1">
                {t(`Your AI credits limit is set to ${aiLimit}`)}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ManagePlanDialog />
    </article>
  );
}
