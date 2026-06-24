import { ToppableFeature } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2, Zap } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';

import { billingMutations } from '../../hooks/billing-hooks';

interface ConsumableProductTopupsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feature: ToppableFeature;
  title: string;
}

export function ConsumableProductTopupsDialog({
  isOpen,
  onOpenChange,
  feature,
  title,
}: ConsumableProductTopupsDialogProps) {
  const [creditsToAdd, setCreditsToAdd] = useState(feature.billingUnits);

  const { mutate: createCheckoutSession, isPending: isCreatingSession } =
    billingMutations.useConsumableProductTopup(() => onOpenChange(false));

  const totalCost =
    (creditsToAdd / feature.billingUnits) * feature.pricePerUnit;

  const handlePurchase = () => {
    createCheckoutSession({
      credits: creditsToAdd,
      featureId: feature.featureId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {title}
          </DialogTitle>
          <DialogDescription>
            {t('Add more credits to your wallet for AI tasks')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>{t('Credits to add')}</span>
              <span className="text-primary font-semibold">
                {t('{creditsToAdd} credits', {
                  creditsToAdd: creditsToAdd.toLocaleString(),
                })}
              </span>
            </div>
            <Slider
              value={[creditsToAdd]}
              onValueChange={(v) => setCreditsToAdd(v[0])}
              min={feature.billingUnits}
              max={feature.billingUnits * 500}
              step={feature.billingUnits}
            />
          </div>

          <div className="rounded-lg border p-4 bg-primary/5 border-primary/30">
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">{t('Total Cost')}</span>
                <span className="text-2xl font-bold text-primary">
                  {t('${totalCost}', {
                    totalCost: totalCost.toFixed(2),
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingSession}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handlePurchase}
            className="gap-2"
            disabled={isCreatingSession || creditsToAdd < feature.billingUnits}
          >
            {isCreatingSession ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isCreatingSession ? t('Processing...') : t('Purchase Credits')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
