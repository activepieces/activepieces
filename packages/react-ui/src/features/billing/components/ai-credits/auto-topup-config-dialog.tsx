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

import { billingMutations } from '../../lib/billing-hooks';

interface AutoTopUpConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentThreshold?: number | null;
  currentCreditsToAdd?: number | null;
  isEditing?: boolean;
}

export function AutoTopUpConfigDialog({
  isOpen,
  onOpenChange,
  currentThreshold,
  currentCreditsToAdd,
  isEditing = false,
}: AutoTopUpConfigDialogProps) {
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = useState(currentThreshold ?? 1000);
  const [creditsToAdd, setCreditsToAdd] = useState(currentCreditsToAdd ?? 10000);

  const { mutate: enableAutoTopUp, isPending: isEnabling } =
    billingMutations.useEnableAutoTopUp(queryClient);

  const { mutate: updateAutoTopUp, isPending: isUpdating } =
    billingMutations.useUpdateAutoTopUpConfig(queryClient);

  const isPending = isEnabling || isUpdating;

  const handleSave = () => {
    const params = {
      minThreshold: threshold,
      creditsToAdd: creditsToAdd,
    };

    const onSuccess = () => {
      onOpenChange(false);
    };

    if (isEditing) {
      updateAutoTopUp(params, { onSuccess });
    } else {
      enableAutoTopUp(params, { onSuccess });
    }
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
