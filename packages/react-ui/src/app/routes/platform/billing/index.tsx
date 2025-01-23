import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ClipboardCheck, CircleHelp, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progres-bar';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';

import { platformBillingApi } from './api/billing-api';
import { TasksLimitDialog } from './dialogs/tasks';
import {
  calculateTaskCostHelper,
  calculateTotalCostHelper,
} from './helpers/platform-billing-helper';

const fetchSubscriptionInfo = async () => {
  return await platformBillingApi.getSubscription();
};

export default function Billing() {
  const [isTasksLimitDialogOpen, setIsTasksLimitDialogOpen] = useState(false);
  const [tasksLimit, setTasksLimit] = useState<number | undefined>(undefined);
  const [aiLimit, setAiLimit] = useState<number | undefined>(undefined);
  const { platform } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();

  const { data: platformSubscription, error: subscriptionError } = useQuery({
    queryKey: ['platform-billing-subscription', platform.id],
    queryFn: fetchSubscriptionInfo,
    enabled: !!platform,
  });

  useEffect(() => {
    if (subscriptionError) {
      toast({
        title: t('Error fetching subscription'),
        description: t('Failed to load subscription details'),
        variant: 'destructive',
      });
    }
  }, [subscriptionError]);

  useEffect(() => {
    if (platformSubscription?.subscription) {
      setTasksLimit(platformSubscription.subscription.tasksLimit ?? 0);
      setAiLimit(platformSubscription.subscription.aiCreditsLimit ?? 0);
    }
  }, [platformSubscription]);

  const updateLimitsMutation = useMutation({
    mutationFn: (data: { tasksLimit?: number | null | undefined }) =>
      platformBillingApi.update(data.tasksLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['platform-billing-subscription', platform.id],
      });
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

  async function handleTasksLimitSubmit(
    limit: number | undefined,
  ): Promise<void> {
    setTasksLimit(limit);
    try {
      await updateLimitsMutation.mutateAsync({
        tasksLimit: limit === undefined ? null : limit,
      });
    } catch (error) {
      console.error('Failed to update tasks limit:', error);
    }
  }

  const daysRemaining = useMemo(() => {
    if (!platformSubscription?.nextBillingDate) return 0;
    return Math.ceil(
      (new Date(platformSubscription.nextBillingDate).getTime() -
        new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }, [platformSubscription?.nextBillingDate]);

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

  const calculateTaskCost = useMemo(() => {
    return calculateTaskCostHelper(
      platformSubscription?.flowRunCount || 0,
      tasksLimit ?? 0,
    );
  }, [platformSubscription?.flowRunCount, tasksLimit]);

  const calculateTotalCost = useMemo(() => {
    return calculateTotalCostHelper(calculateTaskCost);
  }, [calculateTaskCost]);

  const isSubscriptionActive =
    platformSubscription?.subscription.stripeSubscriptionStatus === 'active';

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
                      {t(
                        `You have a maximum of ${tasksLimit} tasks available.`,
                      )}
                      <span
                        className="ml-2 text-primary cursor-pointer"
                        onClick={() => setIsTasksLimitDialogOpen(true)}
                      >
                        {t('Edit')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span
                        className={`${
                          isSubscriptionActive
                            ? 'text-primary cursor-pointer ml-2 '
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() =>
                          isSubscriptionActive &&
                          setIsTasksLimitDialogOpen(true)
                        }
                      >
                        {t('Add Limit')}
                      </span>
                      {!isSubscriptionActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CircleHelp className="w-4 h-4" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {t(
                                'To set usage limits, please add your payment details.',
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
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
                      {t(`You have a maximum of ${aiLimit} credits available.`)}
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
        onSubmit={handleTasksLimitSubmit}
        initialLimit={tasksLimit}
      />
    </article>
  );
}
