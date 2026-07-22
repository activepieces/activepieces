import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingMutations, billingQueries } from '../hooks/billing-hooks';

import { planSelectorUtils } from './plan-selector-utils';

export function KeepPlanDialog({
  open,
  onOpenChange,
  info,
}: KeepPlanDialogProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans } = billingQueries.useListPlans(platform.id, open);
  const { mutate: reactivate, isPending } =
    billingMutations.useReactivateSubscription(() => onOpenChange(false));

  const apiPlan = plans?.find((plan) => plan.id === info.plan.plan);
  const planName =
    info.autumnPlanName ??
    (isNil(apiPlan) ? '' : planSelectorUtils.cleanName(apiPlan));
  const priceLabel = isNil(apiPlan?.price)
    ? apiPlan?.priceDisplay ?? null
    : `$${apiPlan.price.toLocaleString()}${
        apiPlan.interval === planSelectorUtils.ANNUAL_INTERVAL
          ? t('/year')
          : t('/mo')
      }`;
  const creditsLabel = isNil(apiPlan?.includedCredits)
    ? null
    : planSelectorUtils.creditsLabel({
        credits: apiPlan.includedCredits,
        interval: apiPlan.creditsResetInterval,
      });
  const seatsLabel = isNil(apiPlan?.includedSeats)
    ? null
    : t('{count, plural, =1 {1 seat} other {# seats}}', {
        count: apiPlan.includedSeats,
      });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {t('Keep the {plan} plan?', { plan: planName })}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Your scheduled switch to the {plan} plan on {date} will be canceled and your subscription will continue unchanged.',
              {
                plan: info.scheduledPlanName ?? t('Free'),
                date: dayjs(info.cancelAt).format('MMM D, YYYY'),
              },
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
          {!isNil(priceLabel) && (
            <DetailRow label={t('Price')} value={priceLabel} />
          )}
          {!isNil(creditsLabel) && (
            <DetailRow label={t('Credits')} value={creditsLabel} />
          )}
          {!isNil(seatsLabel) && (
            <DetailRow label={t('Seats')} value={seatsLabel} />
          )}
          {!isNil(info.nextBillingDate) && (
            <DetailRow
              label={t('Renews on')}
              value={dayjs(info.nextBillingDate).format('MMM D, YYYY')}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            loading={isPending}
            onClick={() => reactivate()}
          >
            {t('Keep {plan} plan', { plan: planName })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

type KeepPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: PlatformBillingInformation;
};
