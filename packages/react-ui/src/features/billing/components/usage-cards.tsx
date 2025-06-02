import { t } from 'i18next';
import {
  Database,
  LayoutGrid,
  Package,
  LucideIcon,
  Users,
  Server,
} from 'lucide-react';

import { CardContent, Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { isNil, PlatformBillingInformation } from '@activepieces/shared';

export const UsageCards = ({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) => {
  const { usage, plan } = platformSubscription;

  return (
    <div className="grid grid-cols-3 xl:grid-cols-5 gap-6">
      <UsageCard
        icon={Users}
        title={t('Member seats')}
        used={usage.seats}
        total={plan.userSeatsLimit}
      />
      <UsageCard
        icon={LayoutGrid}
        title={t('Projects')}
        used={usage.projects}
        total={plan.projectsLimit}
      />
      <UsageCard
        icon={Package}
        title={t('MCP Servers')}
        used={usage.mcp}
        total={plan.mcpLimit}
      />

      <UsageCard
        icon={Database}
        title={t('Tables')}
        used={usage.tables}
        total={plan.tablesLimit}
      />
      <UsageCard
        icon={Server}
        title={t('Active flows')}
        used={usage.activeFlows}
        total={plan.activeFlowsLimit}
      />
    </div>
  );
};

interface UsageCardProps {
  icon: LucideIcon;
  title: string;
  used: number;
  total?: number;
  showProgress?: boolean;
}

export default function UsageCard({
  icon: Icon,
  title,
  used,
  total,
  showProgress = true,
}: UsageCardProps) {
  const isUnlimited = isNil(total);
  const usagePercentage = isUnlimited ? 100 : (used / total) * 100;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md border">
              <Icon className="w-4 h-4" />
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
              <span className="text-xs font-medium text-muted-foreground">
                {isUnlimited ? 'Unlimited' : 'Usage'}
              </span>
            </div>

            {showProgress && (
              <Progress value={usagePercentage} className="w-full" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
