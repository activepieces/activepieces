import { Sparkle } from 'lucide-react';
import { FC } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanCard } from '@/features/billing/components/plan-card';
import { planData } from '@/features/billing/lib/data';
import { platformHooks } from '@/hooks/platform-hooks';
import { PlatformUsageMetric } from '@activepieces/shared';

import { billingQueries } from '../../lib/billing-hooks';

import { useManagePlanDialogStore } from './store';

export const UpgradeDialog: FC = () => {
  const { dialog, closeDialog } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  const messages: Record<string, string> = {
    [PlatformUsageMetric.ACTIVE_FLOWS]:
      'You have run out of active flows. Upgrade to get more.',
    [PlatformUsageMetric.MCPS]:
      'You have run out of MCP servers. Upgrade to get more.',
    [PlatformUsageMetric.TABLES]:
      'You have run out of tables. Upgrade to get more.',
    [PlatformUsageMetric.USER_SEATS]:
      'You have run out of user seats. Upgrade to get more.',
    [PlatformUsageMetric.AGENTS]: 'Upgrade to unlock agents.',
  };

  const message = dialog.metric ? messages[dialog.metric] : undefined;
  const title = dialog.title || 'Manage Your Plan';

  return (
    <Dialog
      open={dialog.isOpen}
      onOpenChange={(open) => !open && closeDialog()}
    >
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
              setDialogOpen={closeDialog}
              billingInformation={platformBillingInformation}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
