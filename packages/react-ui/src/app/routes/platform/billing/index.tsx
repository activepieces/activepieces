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

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress-bar';
import { LoadingSpinner } from '@/components/ui/spinner';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';

import { platformBillingApi } from './api/billing-api';
import {
  calculateTaskCostHelper,
  calculateTotalCostHelper,
} from './helpers/platform-billing-helper';

export default function Billing() {
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: platformSubscription,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['platform-billing-subscription', platform.id],
    queryFn: platformBillingApi.getSubscription,
    enabled: !!platform,
  });

  const calculateTaskCost = calculateTaskCostHelper(
    platformSubscription?.flowRunCount || 0,
    platformSubscription?.subscription.includedTasks || 0,
  );

  const calculateTotalCost = calculateTotalCostHelper(
    Number(calculateTaskCost),
  );

  const openNewWindow = useNewWindow();

  const { mutate: manageBilling } = useMutation({
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

  const daysRemaining = platformSubscription?.nextBillingDate
    ? dayjs(platformSubscription.nextBillingDate).diff(dayjs(), 'day')
    : 0;

  const tasksLimit = platformSubscription?.subscription.tasksLimit ?? 0;
  const aiLimit = platformSubscription?.subscription.aiCreditsLimit ?? 0;

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

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => manageBilling()}>
            Billing portal
          </Button>
          <Button onClick={() => {}}>
            Purchase Add-ons
          </Button>
        </div>
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

      <div className="grid grid-cols-3 gap-6">
        <UsageCard icon={Users} title={t('Member seats')} used={3} total={10} />
        <UsageCard
          icon={LayoutGrid}
          title={t('Projects')}
          used={3}
          total={10}
        />
        <UsageCard
          icon={Package}
          title={t('Private pieces')}
          used={3}
          total={10}
        />

        <UsageCard icon={Database} title={t('Tables')} used={3} total={10} />
        <UsageCard icon={Server} title={t('MCP servers')} used={3} total={10} />
        <UsageCard
          icon={ClipboardCheck}
          title={t('Tasks')}
          used={3}
          total={10}
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
            value={platformSubscription?.aiCredits || 0}
            limit={aiLimit ?? 0}
            label={t('Billing Limit')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-300">
          <div className="text-md font-sm flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            {t('Tasks')}
          </div>
        </CardHeader>
        <CardContent className="py-8 pt-16">
          <Progress
            value={platformSubscription?.flowRunCount || 0}
            limit={tasksLimit ?? 0}
            label={t('Billing Limit')}
          />
        </CardContent>
      </Card>
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
      <CardContent className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 ">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Used {used} of {total}
        </p>
      </CardContent>
    </Card>
  );
}
