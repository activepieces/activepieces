import { t } from 'i18next';
import {
  Bot,
  ClipboardCheck,
  Database,
  LayoutGrid,
  Users,
  Workflow,
} from 'lucide-react';

import { McpSvg } from '@/assets/img/custom/mcp';
import { CardContent, Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PlanName } from '@activepieces/ee-shared';
import { isNil, PlatformBillingInformation } from '@activepieces/shared';

export const UsageCards = ({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) => {
  const { usage, plan } = platformSubscription;
  const isBusinessPlan = plan.plan === PlanName.BUSINESS;
  const isFree = plan.plan === PlanName.FREE;

  return (
    <div
      className={cn('grid gap-6', {
        'grid-cols-3': true,
        'grid-cols-4': isBusinessPlan,
        '2xl:grid-cols-6': plan.plan === PlanName.PLUS,
        '2xl:grid-cols-7': isFree,
      })}
    >
      <UsageCard
        icon={<ClipboardCheck className="w-5 h-5" />}
        title={t('Tasks')}
        used={usage.tasks}
        total={plan.tasksLimit}
      />

      {isFree && (
        <UsageCard
          icon={<Workflow className="w-4 h-4" />}
          title={t('Active flows')}
          used={usage.activeFlows}
          total={plan.activeFlowsLimit}
        />
      )}

      {!isBusinessPlan && (
        <UsageCard
          icon={<Users className="w-4 h-4" />}
          title={t('Users')}
          used={usage.seats}
          total={plan.userSeatsLimit}
        />
      )}

      {!isBusinessPlan && (
        <UsageCard
          icon={<LayoutGrid className="w-4 h-4" />}
          title={t('Projects')}
          used={usage.projects}
          total={plan.projectsLimit}
        />
      )}

      <UsageCard
        icon={<McpSvg className="size-4" />}
        title={t('MCP Servers')}
        used={usage.mcps}
        total={plan.mcpLimit}
      />

      <UsageCard
        icon={<Database className="w-4 h-4" />}
        title={t('Tables')}
        used={usage.tables}
        total={plan.tablesLimit}
      />

      <UsageCard
        icon={<Bot className="w-4 h-4" />}
        title={t('Agents')}
        used={usage.agents}
        total={plan.agentsLimit}
      />
    </div>
  );
};

interface UsageCardProps {
  icon: React.ReactNode;
  title: string;
  used: number;
  total?: number | null;
  showProgress?: boolean;
}

export default function UsageCard({
  icon,
  title,
  used,
  total,
  showProgress = true,
}: UsageCardProps) {
  const isUnlimited = isNil(total);
  const usagePercentage = isUnlimited ? 0 : (used / total) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md border">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {used.toLocaleString()} /{' '}
                {isUnlimited ? 'Unlimited' : total?.toLocaleString()}
              </span>
            </div>

            {showProgress && (
              <Progress
                value={usagePercentage}
                className={cn('w-full', isUnlimited && 'bg-primary/40')}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
