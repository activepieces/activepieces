import dayjs from 'dayjs';
import { t } from 'i18next';
import { Zap, Info, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';
import {
  ApSubscriptionStatus,
  PRICE_PER_EXTRA_ACTIVE_FLOWS,
} from '@activepieces/ee-shared';
import { PlatformPlan } from '@activepieces/shared';

import { useManagePlanDialogStore } from '../../lib/active-flows-addon-dialog-state';
import { billingMutations, billingQueries } from '../../lib/billing-hooks';

export function PurchaseExtraFlowsDialog() {
  const { closeDialog, isOpen } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformPlanInfo, isLoading: isPlatformSubscriptionLoading } =
    billingQueries.usePlatformSubscription(platform.id);

  const activeFlowsUsage = platformPlanInfo?.usage?.activeFlows ?? 0;
  const activeFlowsLimit = platformPlanInfo?.plan.activeFlowsLimit ?? 0;
  const platformPlan = platformPlanInfo?.plan as PlatformPlan;

  const [selectedLimit, setSelectedLimit] = useState(activeFlowsLimit);

  const flowPrice = PRICE_PER_EXTRA_ACTIVE_FLOWS;
  const maxFlows = 100;
  const baseActiveFlows = 10;

  const isUpgrade = selectedLimit > activeFlowsLimit;
  const isSame = selectedLimit === activeFlowsLimit;
  const isDowngrade = selectedLimit < activeFlowsLimit;

  const difference = Math.abs(selectedLimit - activeFlowsLimit);

  const calculatePaidFlows = (limit: number) =>
    Math.max(0, limit - baseActiveFlows);
  const currentPaidFlows = calculatePaidFlows(activeFlowsLimit);
  const newPaidFlows = calculatePaidFlows(selectedLimit);

  const currentCost = currentPaidFlows * flowPrice;
  const additionalCost = isUpgrade
    ? (newPaidFlows - currentPaidFlows) * flowPrice
    : 0;
  const newTotalCost = newPaidFlows * flowPrice;

  const {
    mutate: updateActiveFlowsLimit,
    isPending: isUpdateActiveFlowsLimitPending,
  } = billingMutations.useUpdateActiveFlowsLimit(() => closeDialog());
  const {
    mutate: createSubscription,
    isPending: isCreatingSubscriptionPending,
  } = billingMutations.useCreateSubscription(() => closeDialog());

  useEffect(() => {
    setSelectedLimit(activeFlowsLimit);
  }, [isOpen]);

  const isLoading =
    isUpdateActiveFlowsLimitPending || isCreatingSubscriptionPending;

  const handlePurchase = () => {
    if (!isSame) {
      if (
        platformPlan.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE
      ) {
        createSubscription({ newActiveFlowsLimit: selectedLimit });
      } else {
        updateActiveFlowsLimit({ newActiveFlowsLimit: selectedLimit });
      }
    }
  };

  const formatDate = () =>
    dayjs(
      dayjs.unix(platformPlan.stripeSubscriptionEndDate!).toISOString(),
    ).format('MMM D, YYYY');

  if (isPlatformSubscriptionLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent
        className={cn(
          'max-w-[480px] transition-all  border duration-300 ease-in-out',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {t('Purchase Extra Active Flows')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Currently using {activeFlowsUsage} of {activeFlowsLimit} flows',
              { activeFlowsUsage, activeFlowsLimit },
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>{t('Select your new limit')}</span>
              <span className="text-primary font-semibold">
                {t('{selectedLimit} flows', { selectedLimit })}
              </span>
            </div>
            <Slider
              value={[selectedLimit]}
              onValueChange={(v) => setSelectedLimit(v[0])}
              min={baseActiveFlows}
              max={maxFlows}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{baseActiveFlows}</span>
              <span>{maxFlows}</span>
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg border p-4 transition-all duration-300 ease-in-out',
              isUpgrade
                ? 'bg-primary/5 border-primary/30'
                : isDowngrade
                ? 'bg-amber-50 border-amber-200'
                : 'bg-muted/40 border-border',
            )}
          >
            {isUpgrade && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('Current limit')}
                  </span>
                  <span>
                    {t('{activeFlowsLimit} flows', { activeFlowsLimit })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('Current cost')}
                  </span>
                  <span>
                    {t('${currentCost}/mo', {
                      currentCost: currentCost.toFixed(2),
                    })}
                  </span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('Additional flows')}
                  </span>
                  <span className="text-primary font-medium">
                    {t('+{difference}', { difference })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('Additional cost')}
                  </span>
                  <span className="text-primary font-medium">
                    {t('+${additionalCost}/mo', {
                      additionalCost: additionalCost.toFixed(2),
                    })}
                  </span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between text-sm font-medium">
                  <span>{t('New total')}</span>
                  <span>{t('{selectedLimit} flows', { selectedLimit })}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium">
                    {t('New monthly cost')}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {t('${newTotalCost}/mo', {
                      newTotalCost: newTotalCost.toFixed(2),
                    })}
                  </span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold">
                    {t('Due today')}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {t('${additionalCost}', {
                      additionalCost: additionalCost.toFixed(2),
                    })}
                  </span>
                </div>
              </div>
            )}

            {isDowngrade && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start text-sm gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium">
                      {t(
                        'New limit: {selectedLimit} flows (−{difference} flows)',
                        { selectedLimit, difference },
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {t('Change takes effect on {date}.', {
                        date: formatDate(),
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSame && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {t('No changes')}
                    </p>
                    <p>
                      {t(
                        'Your flow limit remains at {activeFlowsLimit} flows (${currentCost}/mo)',
                        {
                          activeFlowsLimit,
                          currentCost: currentCost.toFixed(2),
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => closeDialog()}
            disabled={isLoading}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handlePurchase}
            className="gap-2"
            disabled={isSame || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isLoading
              ? t('Processing...')
              : isUpgrade
              ? t('Purchase +{difference} flows', { difference })
              : isDowngrade
              ? t('Confirm Downgrade')
              : t('No Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
