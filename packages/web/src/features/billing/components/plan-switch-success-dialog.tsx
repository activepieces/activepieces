import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingQueries } from '../hooks/billing-hooks';
import { usePlanSwitchSuccessDialogStore } from '../stores/plan-switch-success-dialog-state';

import {
  planSelectorUtils,
  type PlanCatalogEntry,
} from './plan-selector-utils';

const HIGHLIGHT_COUNT = 3;

function resolveEntry(planId: string): PlanCatalogEntry | undefined {
  const key = planId.replace(/_annual$/, '');
  return planSelectorUtils.PLAN_CATALOG.find((entry) => entry.key === key);
}

export function PlanSwitchSuccessDialog() {
  const { planId, closeDialog } = usePlanSwitchSuccessDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans } = billingQueries.useListPlans(
    platform.id,
    !isNil(planId),
  );
  const entry = isNil(planId) ? undefined : resolveEntry(planId);
  const features = isNil(entry)
    ? []
    : planSelectorUtils.resolveFeatures({
        entry,
        apiPlan: plans?.find((plan) => plan.id === planId),
      });

  return (
    <Dialog
      open={!isNil(entry)}
      onOpenChange={(open) => !open && closeDialog()}
    >
      <DialogContent showCloseButton={false} className="max-w-md">
        {!isNil(entry) && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success-600">
              <Check className="size-7 text-white" strokeWidth={3} />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold">
                {t("You're on the {plan} plan", { plan: t(entry.name) })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('You now have access to {benefits}.', {
                  benefits: new Intl.ListFormat(undefined, {
                    style: 'long',
                    type: 'conjunction',
                  }).format(
                    features
                      .slice(0, HIGHLIGHT_COUNT)
                      .map((feature) => t(feature.label)),
                  ),
                })}
              </p>
            </div>
            <Button className="w-full" onClick={closeDialog}>
              {t('Got it')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
