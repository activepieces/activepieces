import {
  ConsumableProductAutoTopupParams,
  AiCreditsAutoTopUpState,
  ToppableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { billingMutations } from '../../hooks/billing-hooks';

interface AutoTopUpConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feature: ToppableFeature;
  includedCredits: number;
  currentThreshold?: number | null;
  currentCreditsToAdd?: number | null;
  currentMaxMonthlyLimit?: number | null;
  isEditing?: boolean;
}

export function AutoTopUpConfigDialog({
  isOpen,
  onOpenChange,
  feature,
  includedCredits,
  currentThreshold,
  currentCreditsToAdd,
  currentMaxMonthlyLimit,
  isEditing = false,
}: AutoTopUpConfigDialogProps) {
  const queryClient = useQueryClient();
  const maxCreditsToAdd =
    includedCredits > 0 ? includedCredits : feature.billingUnits * 500;
  const maxThreshold = Math.floor(maxCreditsToAdd / 2);
  const [config, setConfig] = useState<AutoTopUpFormState>({
    threshold: Math.min(currentThreshold ?? feature.billingUnits, maxThreshold),
    creditsToAdd: Math.min(
      currentCreditsToAdd ?? DEFAULT_CREDITS_TO_ADD,
      maxCreditsToAdd,
    ),
    maxMonthlyLimit: currentMaxMonthlyLimit ?? null,
  });

  const { mutate: updateAutoTopUp, isPending: isUpdating } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const isPending = isUpdating;

  const handleSave = () => {
    const params: ConsumableProductAutoTopupParams = {
      minThreshold: config.threshold,
      creditsToAdd: config.creditsToAdd,
      maxMonthlyLimit: config.maxMonthlyLimit,
      state: AiCreditsAutoTopUpState.ENABLED,
      featureId: feature.featureId,
    };

    const onSuccess = () => {
      onOpenChange(false);
    };

    updateAutoTopUp(params, { onSuccess });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('Edit Auto Top-up Configuration')
              : t('Enable Auto Top-up')}
          </DialogTitle>
          <DialogDescription>
            {t('Automatically purchase credits when your balance runs low.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>{t('When credits fall below')}</Label>
                <span className="text-sm font-medium text-primary">
                  {t('{threshold} credits', {
                    threshold: config.threshold.toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[config.threshold]}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, threshold: v[0] }))
                }
                min={0}
                max={maxThreshold}
                step={feature.billingUnits}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(0).toLocaleString()}</span>
                <span>{maxThreshold.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>{t('Add this many credits')}</Label>
                <span className="text-sm font-medium text-primary">
                  {t('{creditsToAdd} credits', {
                    creditsToAdd: config.creditsToAdd.toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[config.creditsToAdd]}
                onValueChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    creditsToAdd: v[0],
                    maxMonthlyLimit:
                      prev.maxMonthlyLimit !== null
                        ? Math.max(prev.maxMonthlyLimit, v[0])
                        : null,
                  }))
                }
                min={feature.billingUnits}
                max={maxCreditsToAdd}
                step={feature.billingUnits}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{feature.billingUnits.toLocaleString()}</span>
                <span>{maxCreditsToAdd.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <Label>{t('Monthly spending limit')}</Label>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {t('Maximum credits to add per month')}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary">
                  {config.maxMonthlyLimit
                    ? t('{maxMonthlyLimit} credits (${usd})', {
                        maxMonthlyLimit:
                          config.maxMonthlyLimit.toLocaleString(),
                        usd: (
                          (config.maxMonthlyLimit / feature.billingUnits) *
                          feature.pricePerUnit
                        ).toFixed(2),
                      })
                    : t('No limit')}
                </span>
              </div>
              <Slider
                value={[config.maxMonthlyLimit ?? 0]}
                onValueChange={(v) =>
                  setConfig((prev) => ({
                    ...prev,
                    maxMonthlyLimit:
                      v[0] === 0 ? null : Math.max(v[0], prev.creditsToAdd),
                  }))
                }
                min={0}
                max={2000000}
                step={10000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('No limit')}</span>
                <span>{t('2,000,000')}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-primary/5 border-primary/30">
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">
                  {t('Payment per top-up')}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {t('${totalCost}', {
                    totalCost: (
                      (config.creditsToAdd / feature.billingUnits) *
                      feature.pricePerUnit
                    ).toFixed(2),
                  })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t('${cost} per {units} credits', {
                  cost: feature.pricePerUnit,
                  units: feature.billingUnits.toLocaleString(),
                })}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <span>
              {t(
                'Changes apply on your next usage — credits are topped up the next time your balance falls below the threshold, not immediately when you save.',
              )}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {t('Save Configuration')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DEFAULT_CREDITS_TO_ADD = 1000;

type AutoTopUpFormState = {
  threshold: number;
  creditsToAdd: number;
  maxMonthlyLimit: number | null;
};
