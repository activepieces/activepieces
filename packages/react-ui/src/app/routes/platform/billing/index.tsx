import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ClipboardCheck, CircleHelp, Sparkles } from 'lucide-react';
import { useState } from 'react';

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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { platformBillingApi } from './api/billing-api';
import { TasksLimitDialog } from './dialogs/tasks';
import {
  calculateTaskCostHelper,
  calculateTotalCostHelper,
} from './helpers/platform-billing-helper';

export default function Billing() {
  const [isTasksLimitDialogOpen, setIsTasksLimitDialogOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformSubscription,
    refetch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['platform-billing-subscription', platform.id],
    queryFn: platformBillingApi.getSubscription,
    enabled: !!platform,
  });

  const updateLimitsMutation = useMutation({
    mutationFn: (data: { tasksLimit?: number | null | undefined }) =>
      platformBillingApi.update(data.tasksLimit),
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Limits updated successfully'),
      });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to update limits'),
        variant: 'destructive',
      });
    },
  });

  const daysRemaining = platformSubscription?.nextBillingDate
    ? dayjs(platformSubscription.nextBillingDate).diff(dayjs(), 'day')
    : 0;

  const openNewWindow = useNewWindow();

  const { mutate: manageBilling, isPending: isBillingPending } = useMutation({
    mutationFn: async () => {
      if (
        platformSubscription?.subscription.stripeSubscriptionStatus === 'active'
      ) {
        const { portalLink } = await platformBillingApi.portalLink();
        openNewWindow(portalLink);
        return;
      }
      const { paymentLink } = await platformBillingApi.upgrade();
      openNewWindow(paymentLink);
    },
    onSuccess: () => {},
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const tasksLimit = platformSubscription?.subscription.tasksLimit ?? 0;
  const aiLimit = platformSubscription?.subscription.aiCreditsLimit ?? 0;

  const calculateTaskCost = calculateTaskCostHelper(
    platformSubscription?.flowRunCount || 0,
    platformSubscription?.subscription.includedTasks || 0,
  );

  const calculateTotalCost = calculateTotalCostHelper(
    Number(calculateTaskCost),
  );

  const isSubscriptionActive =
    platformSubscription?.subscription.stripeSubscriptionStatus === 'active';

  if (isLoading) {
    return (
      <article className="flex flex-col w-full p-6 gap-8">
        <TableTitle>Platform Billing</TableTitle>
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="flex flex-col w-full p-6 gap-8">
        <TableTitle>Platform Billing</TableTitle>
        <div className="flex items-center justify-center h-[400px] text-destructive">
          {t('Failed to load billing information')}
        </div>
      </article>
    );
  }
  return (
    <article className="flex flex-col w-full p-6 gap-8">
      <TableTitle>Platform Billing</TableTitle>

      <section className="flex justify-between items-start gap-8">
        <div>
          <div className="text-[24px]">{t('Billing Amount')}</div>
          <div className="text-[64px] font-bold mt-2">{calculateTotalCost}</div>
          <div className="text-sm text-gray-500">
            {platformSubscription
              ? `Next Billing: ${formatUtils.formatDate(
                  new Date(platformSubscription?.nextBillingDate || ''),
                )} (${daysRemaining} days remaining)`
              : ''}
          </div>
        </div>
        <Button loading={isBillingPending} onClick={() => manageBilling()}>
          {isSubscriptionActive
            ? t('Manage Payment Details')
            : t('Add Payment Details')}
        </Button>
      </section>

      <section>
        <div className="flex flex-col gap-6">
          <div className="gap-4">
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
                          platformSubscription?.subscription?.includedTasks ||
                          1000
                        } tasks free`,
                      )}
                    </div>
                  </div>
                  <div className="basis-2/3">
                    <Progress
                      value={platformSubscription?.flowRunCount || 0}
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
                      onClick={() => setIsTasksLimitDialogOpen(true)}
                      size="sm"
                    >
                      {tasksLimit ? t('Edit') : t('Add Limit')}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="gap-4">
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
                          platformSubscription?.subscription
                            ?.includedAiCredits || 200
                        } credits free`,
                      )}
                    </div>
                  </div>
                  <div className="basis-2/3">
                    <Progress
                      value={platformSubscription?.aiCredits || 0}
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
          </div>
        </div>
      </section>

      <TasksLimitDialog
        open={isTasksLimitDialogOpen}
        onOpenChange={setIsTasksLimitDialogOpen}
        onSubmit={(newLimit) => {
          console.log('newLimit', newLimit);
          updateLimitsMutation.mutateAsync({
            tasksLimit: isNil(newLimit) ? null : newLimit,
          });
        }}
        initialLimit={tasksLimit}
      />
    </article>
  );
}
