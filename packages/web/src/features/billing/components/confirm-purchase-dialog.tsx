import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { billingMutations } from '../hooks/billing-hooks';
import { usePlanSeatFloorGuard } from '../hooks/use-plan-seat-floor-guard';
import { useConfirmPurchaseDialogStore } from '../stores/confirm-purchase-dialog-state';

import { planSelectorUtils } from './plan-selector-utils';

export function ConfirmPurchaseDialog() {
  const { payload, closeDialog } = useConfirmPurchaseDialogStore();
  const { openSeatFloor, seatFloorDialog } = usePlanSeatFloorGuard({
    enabled: !isNil(payload),
  });
  const { mutate: checkout, isPending } = billingMutations.useCheckout({
    onDone: () => closeDialog(),
    onSeatLimitExceeded: ({ params, targetSeats, planName }) => {
      closeDialog();
      openSeatFloor({
        targetSeats,
        planName,
        proceed: () => checkout(params),
      });
    },
  });

  const cycleLabel =
    payload?.billingCycle === planSelectorUtils.ANNUAL_INTERVAL
      ? t('Annually')
      : t('Monthly');

  return (
    <>
      {seatFloorDialog}
      <Dialog
        open={!isNil(payload)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-md">
          {!isNil(payload) && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('Confirm your {plan} plan', { plan: payload.planName })}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    'Review the details below before your payment is processed.',
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 rounded-lg border p-4">
                  <span className="text-sm text-muted-foreground">
                    {t("You'll be charged")}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {payload.priceAmount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t('billed {cycle}', { cycle: cycleLabel.toLowerCase() })}
                    </span>
                  </div>
                </div>

                {payload.features.length > 0 && (
                  <ul className="flex flex-col gap-2.5">
                    {payload.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Check className="size-4 shrink-0 text-primary" />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeDialog()}
                  disabled={isPending}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="button"
                  loading={isPending}
                  onClick={() =>
                    checkout({
                      planId: payload.planId,
                      successUrl: payload.successUrl,
                    })
                  }
                >
                  {t('Confirm & Pay')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
