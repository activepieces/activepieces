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
import { AdminControl, adminControl } from '@/lib/admin-control';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { billingMutations } from '../hooks/billing-hooks';
import { usePlanSeatFloorGuard } from '../hooks/use-plan-seat-floor-guard';

import { planSelectorUtils } from './plan-selector-utils';

export function ConfirmPurchaseDialog() {
  const { purchase, closeDialog } =
    billingDialogHooks.useConfirmPurchaseDialogStore();
  const { openSeatFloor, seatFloorDialog } = usePlanSeatFloorGuard({
    enabled: !isNil(purchase),
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
    purchase?.billingCycle === planSelectorUtils.ANNUAL_INTERVAL
      ? t('Annually')
      : t('Monthly');

  return (
    <>
      {seatFloorDialog}
      <Dialog
        open={!isNil(purchase)}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-md">
          {!isNil(purchase) && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('Confirm your {plan} plan', { plan: purchase.planName })}
                </DialogTitle>
                <DialogDescription>
                  {t(
                    'Review the details below before your payment is processed.',
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 rounded-lg border p-4">
                  <span className="text-sm text-gray-11">
                    {t("You'll be charged")}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {purchase.priceAmount}
                    </span>
                    <span className="text-sm text-gray-11">
                      {t('billed {cycle}', { cycle: cycleLabel.toLowerCase() })}
                    </span>
                  </div>
                </div>

                {purchase.features.length > 0 && (
                  <ul className="flex flex-col gap-2.5">
                    {purchase.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-12"
                      >
                        <Check className="size-4 shrink-0 text-accent-11" />
                        <span>{feature}</span>
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
                  {...adminControl(
                    AdminControl.BILLING_PURCHASE_CONFIRM_SUBMIT,
                  )}
                  type="button"
                  loading={isPending}
                  onClick={() =>
                    checkout({
                      planId: purchase.planId,
                      successUrl: purchase.successUrl,
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
