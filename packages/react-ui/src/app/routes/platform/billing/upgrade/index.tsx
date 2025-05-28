import { FC } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useManagePlanDialogStore } from '@/lib/stores';
import { PlanName } from '@activepieces/ee-shared';

import { planData } from '../data';

import { PlanCard } from './plan-card';

export const ManagePlanDialog: FC = () => {
  const { isOpen, setIsOpen } = useManagePlanDialogStore();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Manage Your Plan</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-6">
          {planData.plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} selected={PlanName.FREE} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
