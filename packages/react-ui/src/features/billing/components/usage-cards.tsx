import { t } from 'i18next';
import { Bot, Database, LayoutGrid, Users, Workflow } from 'lucide-react';

import mcpDark from '@/assets/img/custom/mcp-dark.svg';
import mcpLight from '@/assets/img/custom/mcp-light.svg';
import { useTheme } from '@/components/theme-provider';
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
  const { theme } = useTheme();
  const { usage, plan } = platformSubscription;
  const isBusinessPlan = plan.plan === PlanName.BUSINESS;

  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-6',
        isBusinessPlan ? 'xl:grid-cols-5' : '2xl:grid-cols-6',
      )}
    >
      <UsageCard
        icon={<Workflow className="w-4 h-4" />}
        title={t('Active flows')}
        used={usage.activeFlows}
        total={plan.activeFlowsLimit}
      />

      {!isBusinessPlan && (
        <UsageCard
          icon={<Users className="w-4 h-4" />}
          title={t('Users')}
          used={usage.seats}
          total={plan.userSeatsLimit}
        />
      )}

      <UsageCard
        icon={<LayoutGrid className="w-4 h-4" />}
        title={t('Projects')}
        used={usage.projects}
        total={plan.projectsLimit}
      />

      <UsageCard
        icon={
          <img
            src={theme === 'dark' ? mcpDark : mcpLight}
            alt="MCP"
            className="w-4 h-4"
          />
        }
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
  total?: number;
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
