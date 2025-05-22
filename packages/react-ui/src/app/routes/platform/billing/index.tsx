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
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn, formatUtils } from '@/lib/utils';
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

  const daysRemaining = platformSubscription?.nextBillingDate
    ? dayjs(platformSubscription.nextBillingDate).diff(dayjs(), 'day')
    : 0;

  const tasksLimit = platformSubscription?.plan.tasksLimit ?? 0;
  const aiLimit = platformSubscription?.plan.aiCreditsLimit ?? 0;

  if (isLoading) {
    return (
      <article className="flex flex-col w-full p-6 gap-8">
        <TableTitle>Billing</TableTitle>
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="flex flex-col w-full p-6 gap-8">
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
            Manage billing, usage and project limits
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
        {platformSubscription && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <span>
              Next billing on{' '}
              {formatUtils.formatDate(
                new Date(platformSubscription.nextBillingDate || ''),
              )}
            </span>
            <span>•</span>
            <span>{daysRemaining} days remaining</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <UsageCard
          icon={Users}
          title={t('Member seats')}
          used={platformSubscription?.usage.seats || 0}
          total={platformSubscription?.usage.seats || 0}
        />
        <UsageCard
          icon={LayoutGrid}
          title={t('Projects')}
          used={platformSubscription?.usage.projects || 0}
          total={platformSubscription?.usage.projects || 0}
        />
        <UsageCard
          icon={Package}
          title={t('MCP Servers')}
          used={platformSubscription?.usage.mcp || 0}
          total={platformSubscription?.usage.mcp || 0}
        />

        <UsageCard
          icon={Database}
          title={t('Tables')}
          used={platformSubscription?.usage.tables || 0}
          total={platformSubscription?.usage.tables || 0}
        />
        <UsageCard
          icon={Server}
          title={t('Active flows')}
          used={platformSubscription?.usage.activeFlows || 0}
          total={platformSubscription?.usage.activeFlows || 0}
        />
      </div>


      <Card>
        <CardHeader className="border-b">
          <div className="text-md font-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('AI Credits')}
          </div>
        </CardHeader>
        <CardContent className="py-8 pt-16">
          <Progress
            value={platformSubscription?.usage.aiCredits || 0}
            limit={aiLimit ?? 0}
            label={t('Billing Limit')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="justify-between flex items-center">
            <div className="text-md font-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              {t('Tasks')}
            </div>

            {true && (
              <Button
                variant="link"
                onClick={() => setIsTasksLimitDialogOpen(true)}
                size="sm"
              >
                {tasksLimit ? t('Edit') : t('Add Limit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-8 pt-16">
          <Progress
            value={platformSubscription?.usage.tasks || 0}
            limit={tasksLimit ?? 0}
            label={t('Billing Limit')}
          />
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
  total: number;
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
