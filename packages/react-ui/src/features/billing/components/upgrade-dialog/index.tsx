import { t } from 'i18next';
import { Sparkle } from 'lucide-react';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlanCard } from '@/features/billing/components/plan-card';
import { planData } from '@/features/billing/lib/data';
import { platformHooks } from '@/hooks/platform-hooks';
import { BillingCycle } from '@activepieces/ee-shared';
import { PlatformUsageMetric } from '@activepieces/shared';

import { billingQueries } from '../../lib/billing-hooks';

import { useManagePlanDialogStore } from './store';

export const UpgradeDialog: FC = () => {
  const { dialog, closeDialog } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY,
  );

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
        <DialogHeader className="my-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-left">
              {title}
            </DialogTitle>

            <div className="flex items-center space-x-1 p-1 bg-muted rounded-lg">
              <Button
                variant={
                  selectedCycle === BillingCycle.MONTHLY ? 'default' : 'ghost'
                }
                size="xs"
                onClick={() => setSelectedCycle(BillingCycle.MONTHLY)}
              >
                {t('Monthly')}
              </Button>
              <Button
                variant={
                  selectedCycle === BillingCycle.ANNUAL ? 'default' : 'ghost'
                }
                size="xs"
                onClick={() => setSelectedCycle(BillingCycle.ANNUAL)}
                className="relative"
              >
                {t('Annual')}
                <span className="ml-2 font-semibold text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {t('Save 24%')}
                </span>
              </Button>
            </div>
          </div>

          {message && (
            <div className="text-left font-medium text-lg mt-3 flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-primary" />
              {message}
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {planData.plans.map((plan) => (
            <PlanCard
              cycle={selectedCycle}
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
