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
import { PlatformBillingInformation } from '@activepieces/shared';

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
        used={usage.seats || 0}
        total={plan.userSeatsLimit || 'Unlimited'}
      />
      <UsageCard
        icon={LayoutGrid}
        title={t('Projects')}
        used={usage.projects || 0}
        total={plan.projectsLimit || 'Unlimited'}
      />
      <UsageCard
        icon={Package}
        title={t('MCP Servers')}
        used={usage.mcp || 0}
        total={plan.mcpLimit || 'Unlimited'}
      />

      <UsageCard
        icon={Database}
        title={t('Tables')}
        used={usage.tables || 0}
        total={plan.tablesLimit || 'Unlimited'}
      />
      <UsageCard
        icon={Server}
        title={t('Active flows')}
        used={usage.activeFlows || 0}
        total={plan.activeFlowsLimit || 'Unlimited'}
      />
    </div>
  );
};

export interface UsageCardProps {
  icon: LucideIcon;
  title: string;
  used: number;
  total: number | string;
}

export function UsageCard({ icon: Icon, title, used, total }: UsageCardProps) {
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
