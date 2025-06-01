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
import { useDialogStore } from '@/lib/dialogs-store';

export const ManagePlanDialog: FC = () => {
  const { dialogs, setDialog } = useDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  return (
    <Dialog
      open={dialogs.managePlan}
      onOpenChange={(isOpen) => setDialog('managePlan', isOpen)}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Manage Your Plan
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {planData.plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              billingInformation={platformBillingInformation}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
