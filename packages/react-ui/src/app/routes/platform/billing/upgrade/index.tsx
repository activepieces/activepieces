import { useQuery } from '@tanstack/react-query';
import { FC } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { useManagePlanDialogStore } from '@/lib/stores';

import { platformBillingApi } from '../api/billing-api';
import { planData } from '../data';

import { PlanCard } from './plan-card';

export const ManagePlanDialog: FC = () => {
  const { isOpen, setIsOpen } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: platformBillingInformation, refetch } = useQuery({
    queryKey: ['platform-billing-subscription', platform.id],
    queryFn: platformBillingApi.getSubscriptionInfo,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              refetch={refetch}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
