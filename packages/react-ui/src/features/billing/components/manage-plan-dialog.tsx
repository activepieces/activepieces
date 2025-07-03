import { Sparkle } from 'lucide-react';
import { FC } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanCard } from '@/features/billing/components/plan-card';
import { billingQueries } from '@/features/billing/lib/billing-hooks';
import { planData } from '@/features/billing/lib/data';
import { platformHooks } from '@/hooks/platform-hooks';

type ManagePlanDialogProps = {
  metric?: 'activeFlows' | 'mcp' | 'tables' | 'userSeats' | 'agents';
  title?: string;
  open: boolean;
  setOpen: (isOpen: boolean) => void;
};

const messages: Record<string, string> = {
  activeFlows: 'You have run out of active flows. Upgrade to get more.',
  mcp: 'You have run out of MCP servers. Upgrade to get more.',
  tables: 'You have run out of tables. Upgrade to get more.',
  userSeats: 'You have run out of user seats. Upgrade to get more.',
  agents: 'Upgrade to unlock agents.',
};

export const ManagePlanDialog: FC<ManagePlanDialogProps> = ({
  metric,
  title = 'Manage Your Plan',
  open,
  setOpen,
}) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  const message = metric ? messages[metric] : undefined;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-col items-center mb-6">
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            {title}
            {message && (
              <div className="text-center font-medium text-lg mb-4 mt-3 flex items-center justify-center gap-2">
                <Sparkle className="h-5 w-5 text-primary" />
                {message}
                <Sparkle className="h-5 w-5 text-primary" />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {planData.plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              setDialogOpen={setOpen}
              billingInformation={platformBillingInformation}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
