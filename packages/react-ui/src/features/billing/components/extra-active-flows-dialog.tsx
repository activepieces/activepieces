import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import {
  BillingCycle,
  getPlanLimits,
  PlanName,
  PRICE_PER_EXTRA_5_ACTIVE_FLOWS,
  StripePlanName,
} from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

import { billingMutations } from '../lib/billing-hooks';

const MAX_ACTIVE_FLOWS_PLUS = 40;
const MAX_ACTIVE_FLOWS_BUSINESS = 100;

type ExtraActiveFlowsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformSubscription: PlatformBillingInformation;
};

const getMaxActiveFlows = (plan?: string) => {
  if (plan === PlanName.PLUS) {
    return MAX_ACTIVE_FLOWS_PLUS;
  }
  if (plan === PlanName.BUSINESS) {
    return MAX_ACTIVE_FLOWS_BUSINESS;
  }
  return MAX_ACTIVE_FLOWS_PLUS;
};

export const ExtraActiveFlowsDialog = ({
  open,
  onOpenChange,
  platformSubscription,
}: ExtraActiveFlowsDialogProps) => {
  const { plan } = platformSubscription;

  const DEFAULT_ACTIVE_FLOWS =
    getPlanLimits(plan.plan as PlanName).activeFlowsLimit ?? 0;
  const currentActiveFlowLimit = plan.activeFlowsLimit ?? DEFAULT_ACTIVE_FLOWS;
  const [selectedActiveFlows, setSelectedActiveFlows] = useState([
    currentActiveFlowLimit,
  ]);

  const maxActiveFlows = getMaxActiveFlows(plan.plan);
  const newActiveFlowCount = selectedActiveFlows[0];
  const activeFlowDifference = newActiveFlowCount - currentActiveFlowLimit;
  const costDifference =
    (activeFlowDifference / 5) * PRICE_PER_EXTRA_5_ACTIVE_FLOWS;

  const { mutate: updateActiveFlows, isPending } =
    billingMutations.useUpdateSubscription(() => onOpenChange(false));

  useEffect(() => {
    setSelectedActiveFlows([currentActiveFlowLimit]);
  }, [currentActiveFlowLimit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Manage Active Flows
          </DialogTitle>
          <DialogDescription>
            Adjust your automation capacity by modifying the number of active
            flows.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                Total number of active flows
              </label>
              <p className="text-lg font-bold px-3 py-1">
                {newActiveFlowCount}
              </p>
            </div>
            <div className="space-y-3">
              <Slider
                value={selectedActiveFlows}
                onValueChange={setSelectedActiveFlows}
                max={maxActiveFlows}
                min={DEFAULT_ACTIVE_FLOWS}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentActiveFlowLimit} flows (current limit)</span>
                <span>{maxActiveFlows} flows (maximum)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Current active flows limit: {currentActiveFlowLimit}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  {costDifference >= 0
                    ? 'Additional Monthly Cost'
                    : 'Monthly Savings'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(activeFlowDifference)} flow
                  {Math.abs(activeFlowDifference) !== 1 ? 's' : ''} (
                  {Math.abs(activeFlowDifference) / 5} package
                  {Math.abs(activeFlowDifference) / 5 !== 1 ? 's' : ''}) × $
                  {PRICE_PER_EXTRA_5_ACTIVE_FLOWS}
                </div>
              </div>
              <div
                className={`text-2xl font-bold ${
                  costDifference >= 0 ? 'text-primary' : 'text-green-600'
                }`}
              >
                {costDifference >= 0 ? '+' : '-'}${Math.abs(costDifference)}
              </div>
            </div>
          </div>

          {activeFlowDifference < 0 && (
            <div className="text-xs text-muted-foreground">
              You will be charged a prorated amount for the remaining days of
              the month.
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              updateActiveFlows({
                plan: plan.plan as StripePlanName,
                addons: {
                  activeFlows: newActiveFlowCount,
                },
                cycle: plan.stripeBillingCycle as BillingCycle,
              })
            }
            disabled={
              isPending || newActiveFlowCount === currentActiveFlowLimit
            }
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating Active Flows
              </>
            ) : (
              'Update Active Flows'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
