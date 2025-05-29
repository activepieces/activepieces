import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { FC } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { useManagePlanDialogStore } from '@/lib/stores';
import { PlanName, UpdateSubscriptionParams } from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

import { platformBillingApi } from '../api/billing-api';
import { planData } from '../data';

import { PlanCard } from './plan-card';

export const ManagePlanDialog: FC = () => {
  const { isOpen, setIsOpen } = useManagePlanDialogStore();
  const queryClient = useQueryClient();

  const { data: platformSubscription } = useQuery({
    queryKey: ['platform-billing-subscription'],
    queryFn: platformBillingApi.getSubscriptionInfo,
  });

  const { mutate: upgradePlan } = useMutation({
    mutationFn: (params: UpdateSubscriptionParams) =>
      platformBillingApi.updateSubscription(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['platform-billing-subscription'],
      });
      setIsOpen(false);
      toast({
        title: t('Success'),
        description: t('Plan upgraded successfully'),
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const { mutate: createSubscription } = useMutation({
    mutationFn: async (params: UpdateSubscriptionParams) => {
      const checkoutSessionURl = await platformBillingApi.createSubscription(
        params,
      );
      window.open(checkoutSessionURl, '_blank');
    },
    onSuccess: () => {
      setIsOpen(false);
      toast({
        title: t('Success'),
        description: t('Plan created successfully'),
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const handleUpgrade = (params: UpdateSubscriptionParams) => {
    if (isNil(platformSubscription?.plan.stripeSubscriptionId)) {
      createSubscription(params);
    } else {
      upgradePlan(params);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Manage Your Plan
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-6">
          {planData.plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              selected={PlanName.FREE}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
