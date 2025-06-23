import { useQuery, useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  ClipboardCheck,
  Sparkles,
  Users,
  LayoutGrid,
  Package,
  Database,
  Server,
  LucideIcon,
  CircleHelp,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';

import { TableTitle } from '@/components/custom/table-title';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
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
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['platform-billing-subscription', platform.id],
    queryFn: platformBillingApi.getSubscription,
    enabled: !!platform,
  });

  const isSubscriptionActive =
    platformSubscription?.plan.stripeSubscriptionStatus === 'active';

  const calculateTaskCost = calculateTaskCostHelper(
    platformSubscription?.usage.tasks || 0,
    platformSubscription?.plan.tasksLimit || 0,
  );

  const calculateTotalCost = calculateTotalCostHelper(
    Number(calculateTaskCost),
  );

  const openNewWindow = useNewWindow();

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

  const { mutate: manageBilling, isPending: isBillingPending } = useMutation({
    mutationFn: async () => {
      if (platformSubscription?.plan.stripeSubscriptionStatus === 'active') {
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

  const tasksLimit = platformSubscription?.plan.tasksLimit ?? 0;
  const aiLimit = platformSubscription?.plan.aiCreditsLimit ?? 0;

  if (isLoading) {
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

        <Button loading={isBillingPending} onClick={() => manageBilling()}>
          {isSubscriptionActive
            ? t('Manage Payment Details')
            : t('Add Payment Details')}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold">{calculateTotalCost}</div>
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

      <div className="grid grid-cols-3 xl:grid-cols-5 gap-6">
        <UsageCard
          icon={Users}
          title={t('Member seats')}
          used={platformSubscription?.usage.seats || 0}
          total={platformSubscription?.plan.userSeatsLimit || 'Unlimited'}
        />
        <UsageCard
          icon={LayoutGrid}
          title={t('Projects')}
          used={platformSubscription?.usage.projects || 0}
          total={platformSubscription?.plan.projectsLimit || 'Unlimited'}
        />
        <UsageCard
          icon={Package}
          title={t('MCP Servers')}
          used={platformSubscription?.usage.mcp || 0}
          total={platformSubscription?.plan.mcpLimit || 'Unlimited'}
        />

        <UsageCard
          icon={Database}
          title={t('Tables')}
          used={platformSubscription?.usage.tables || 0}
          total={platformSubscription?.plan.tablesLimit || 'Unlimited'}
        />
        <UsageCard
          icon={Server}
          title={t('Active flows')}
          used={platformSubscription?.usage.activeFlows || 0}
          total={platformSubscription?.plan.activeFlowsLimit || 'Unlimited'}
        />
      </div>

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
                onClick={() => setIsTasksLimitDialogOpen(true)}
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

interface UsageCardProps {
  icon: LucideIcon;
  title: string;
  used: number;
  total: number | string;
}

function UsageCard({ icon: Icon, title, used, total }: UsageCardProps) {
  return (
    <Card>
      <CardContent className="px-6 py-4  gap-4 flex flex-col">
        <div className="flex items-center  gap-2 ">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <p className="text-base text-muted-foreground">
          Used {used} of {total}
        </p>
      </CardContent>
    </Card>
  );
}
