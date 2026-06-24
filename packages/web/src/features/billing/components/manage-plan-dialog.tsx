import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingMutations, billingQueries } from '../hooks/billing-hooks';
import { useManagePlanDialogStore } from '../stores/active-flows-addon-dialog-state';

export function ManagePlanDialog() {
  const { isOpen, closeDialog } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans, isLoading } = billingQueries.useListPlans(
    platform.id,
    isOpen,
  );
  const { mutate: checkout, isPending } = billingMutations.useCheckout(() =>
    closeDialog(),
  );
  const currentPlanId = platform.plan.plan;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('Manage Plan')}</DialogTitle>
          <DialogDescription>
            {t('Choose the plan that fits your team.')}
          </DialogDescription>
        </DialogHeader>
        {isLoading || isNil(plans) ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Item key={plan.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>{plan.name}</ItemTitle>
                    <ItemDescription>
                      {plan.priceDisplay ??
                        (isNil(plan.price)
                          ? t('Free')
                          : `$${plan.price}${
                              plan.interval ? `/${plan.interval}` : ''
                            }`)}
                      {plan.description ? ` · ${plan.description}` : ''}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant={isCurrent ? 'outline' : 'default'}
                      size="sm"
                      disabled={isCurrent || isPending}
                      onClick={() => checkout({ planId: plan.id })}
                    >
                      {isCurrent ? t('Current plan') : t('Select')}
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
