import { isNil } from '@activepieces/core-utils';
import { PurchasablePlan } from '@activepieces/shared';
import { t } from 'i18next';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
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
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

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
  const { mutateAsync: cancelSubscription } =
    billingMutations.useCancelSubscription(() => closeDialog());

  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    isOpen,
  );
  const currentPlanId = subscription?.currentPlanId ?? platform.plan.plan;

  const purchasablePlans = (plans ?? []).filter(
    (plan) => plan.id !== FREE_PLAN_ID,
  );
  const currentPlan = purchasablePlans.find(
    (plan) => plan.id === currentPlanId,
  );
  const isOnSelfServePaidPlan =
    !isNil(currentPlan) && (currentPlan.price ?? 0) > 0;

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
            {purchasablePlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Item key={plan.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>{plan.name}</ItemTitle>
                    <ItemDescription>{priceLabel(plan)}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant={isCurrent ? 'outline' : 'default'}
                      size="sm"
                      disabled={isCurrent || isPending}
                      onClick={() =>
                        checkout({
                          planId: plan.id,
                          successUrl: buildSuccessUrl(
                            actionFor(plan, currentPlanId, currentPlan),
                          ),
                        })
                      }
                    >
                      {isCurrent ? t('Current plan') : t('Select')}
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
            {isOnSelfServePaidPlan && (
              <ConfirmationDeleteDialog
                title={t('Switch to the Free plan')}
                message={t(
                  'Your current plan stays active until the end of the billing period, then your workspace moves to the Free plan.',
                )}
                warning={t(
                  'On the Free plan you get 100 credits per day and 1 user, and paid features (such as SSO, global connections and higher limits) are turned off.',
                )}
                buttonText={t('Switch to Free')}
                entityName={t('subscription')}
                mutationFn={async () => {
                  await cancelSubscription();
                }}
              >
                <Button variant="ghost" size="sm" className="self-start">
                  {t('Switch to the Free plan')}
                </Button>
              </ConfirmationDeleteDialog>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function priceLabel(plan: PurchasablePlan): string {
  if (plan.priceDisplay) {
    return plan.priceDisplay;
  }
  if (isNil(plan.price)) {
    return t('Free');
  }
  return `$${plan.price}${plan.interval ? `/${plan.interval}` : ''}`;
}

function actionFor(
  target: PurchasablePlan,
  currentPlanId: string | null | undefined,
  currentPlan: PurchasablePlan | undefined,
): CheckoutAction {
  if (
    isNil(currentPlanId) ||
    currentPlanId === FREE_PLAN_ID ||
    isNil(currentPlan)
  ) {
    return 'create';
  }
  return (target.price ?? 0) > (currentPlan.price ?? 0)
    ? 'upgrade'
    : 'downgrade';
}

function buildSuccessUrl(action: CheckoutAction): string {
  return `${window.location.origin}/platform/setup/billing/success?action=${action}`;
}

const FREE_PLAN_ID = 'free';

type CheckoutAction = 'create' | 'upgrade' | 'downgrade';
