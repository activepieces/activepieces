import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
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
import { UpdateAICreditsAutoTopUpParamsSchema } from '@activepieces/ee-shared';
import { AiCreditsAutoTopUpState } from '@activepieces/shared';

import { billingMutations } from '../../lib/billing-hooks';

interface AutoTopUpConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentThreshold?: number | null;
  currentCreditsToAdd?: number | null;
  currentMaxMonthlyLimit?: number | null;
  isEditing?: boolean;
}

export function AutoTopUpConfigDialog({
  isOpen,
  onOpenChange,
  currentThreshold,
  currentCreditsToAdd,
  currentMaxMonthlyLimit,
  isEditing = false,
}: AutoTopUpConfigDialogProps) {
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = useState(currentThreshold ?? 1000);
  const [creditsToAdd, setCreditsToAdd] = useState(
    currentCreditsToAdd ?? 10000,
  );
  const [maxMonthlyLimit, setMaxMonthlyLimit] = useState<number | null>(
    currentMaxMonthlyLimit ?? null,
  );

  const { mutate: updateAutoTopUp, isPending: isUpdating } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const isPending = isUpdating;

  const handleSave = () => {
    const params: UpdateAICreditsAutoTopUpParamsSchema = {
      minThreshold: threshold,
      creditsToAdd: creditsToAdd,
      maxMonthlyLimit: maxMonthlyLimit,
      state: AiCreditsAutoTopUpState.ENABLED,
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
                    threshold: threshold.toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={(v) => setThreshold(v[0])}
                min={0}
                max={100000}
                step={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('0')}</span>
                <span>{t('100,000')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>{t('Add this many credits')}</Label>
                <span className="text-sm font-medium text-primary">
                  {t('{creditsToAdd} credits', {
                    creditsToAdd: creditsToAdd.toLocaleString(),
                  })}
                </span>
              </div>
              <Slider
                value={[creditsToAdd]}
                onValueChange={(v) => setCreditsToAdd(v[0])}
                min={1000}
                max={500000}
                step={1000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('1,000')}</span>
                <span>{t('500,000')}</span>
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
                  {maxMonthlyLimit
                    ? t('{maxMonthlyLimit} credits (${usd})', {
                        maxMonthlyLimit: maxMonthlyLimit.toLocaleString(),
                        usd: ((maxMonthlyLimit / 1000) * 1).toFixed(2),
                      })
                    : t('No limit')}
                </span>
              </div>
              <Slider
                value={[maxMonthlyLimit ?? 0]}
                onValueChange={(v) =>
                  setMaxMonthlyLimit(v[0] === 0 ? null : v[0])
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
                    totalCost: ((creditsToAdd / 1000) * 1).toFixed(2),
                  })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {t('$1 per 1000 credits')}
              </div>
            </div>
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
