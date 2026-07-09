import { isNil } from '@activepieces/core-utils';
import { PurchasablePlan } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Info } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { billingMutations, billingQueries } from '../hooks/billing-hooks';
import { useConfirmPurchaseDialogStore } from '../stores/confirm-purchase-dialog-state';

import {
  DROP_TO_FREE_MESSAGE,
  DROP_TO_FREE_WARNING,
  planSelectorUtils,
  type BillingCycle,
  type CheckoutAction,
  type PlanCatalogEntry,
  type PlanPricing,
} from './plan-selector-utils';

export function PlanSelector({ enabled, onSelected }: PlanSelectorProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans, isLoading } = billingQueries.useListPlans(
    platform.id,
    enabled,
  );
  const {
    mutate: checkout,
    isPending,
    variables: checkoutVariables,
  } = billingMutations.useCheckout(onSelected);
  const { mutateAsync: cancelSubscription } =
    billingMutations.useCancelSubscription(onSelected);
  const { mutate: reactivate, isPending: isReactivating } =
    billingMutations.useReactivateSubscription(onSelected);
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    enabled,
  );
  const { openDialog: openConfirmDialog } = useConfirmPurchaseDialogStore();

  const currentPlanId = subscription?.plan.plan ?? platform.plan.plan;
  const hasScheduledChange = !isNil(subscription?.cancelAt);
  const allPlans = plans ?? [];
  const currentPlan = allPlans.find((plan) => plan.id === currentPlanId);
  const hasAnnualOption = allPlans.some(
    (plan) => plan.interval === planSelectorUtils.ANNUAL_INTERVAL,
  );
  const [cycleOverride, setCycleOverride] = useState<BillingCycle | null>(null);
  const billingCycle =
    cycleOverride ??
    (currentPlan?.interval === planSelectorUtils.ANNUAL_INTERVAL
      ? 'year'
      : 'month');

  const handleCheckout = (intent: CheckoutIntent) => {
    const successUrl = planSelectorUtils.buildSuccessUrl(intent.action);
    if (subscription?.billingPortalAvailable) {
      openConfirmDialog({
        planId: intent.planId,
        planName: intent.planName,
        priceAmount: intent.priceAmount,
        billingCycle,
        features: intent.features,
        successUrl,
      });
      onSelected?.();
      return;
    }
    checkout({ planId: intent.planId, successUrl });
  };

  if (isLoading || isNil(plans)) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PlanColumnSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {hasAnnualOption && (
        <Tabs
          value={billingCycle}
          onValueChange={(value) => setCycleOverride(value as BillingCycle)}
          className="self-center"
        >
          <TabsList>
            <TabsTrigger value="month">{t('Monthly')}</TabsTrigger>
            <TabsTrigger value="year">{t('Annually')}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planSelectorUtils.PLAN_CATALOG.map((entry) => {
          const apiPlan =
            entry.key === 'enterprise'
              ? undefined
              : planSelectorUtils.findPurchasablePlan({
                  plans: allPlans,
                  key: entry.key,
                  cycle: billingCycle,
                });
          const monthlySibling =
            entry.key === 'enterprise' || entry.key === 'free'
              ? undefined
              : planSelectorUtils.findPurchasablePlan({
                  plans: allPlans,
                  key: entry.key,
                  cycle: 'month',
                });
          return (
            <PlanColumn
              key={entry.key}
              entry={entry}
              apiPlan={apiPlan}
              pricing={planSelectorUtils.computePricing({
                entry,
                apiPlan,
                monthlySibling,
              })}
              currentPlanId={currentPlanId}
              hasScheduledChange={hasScheduledChange}
              isReactivating={isReactivating}
              isPending={isPending}
              checkoutPlanId={isPending ? checkoutVariables?.planId : undefined}
              onCheckout={handleCheckout}
              onKeepPlan={() => reactivate()}
              onDowngrade={async () => {
                await cancelSubscription();
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PlanColumnSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function PlanColumn({
  entry,
  apiPlan,
  pricing,
  currentPlanId,
  hasScheduledChange,
  isReactivating,
  isPending,
  checkoutPlanId,
  onCheckout,
  onKeepPlan,
  onDowngrade,
}: PlanColumnProps) {
  const isFree = entry.key === 'free';
  const isEnterprise = entry.key === 'enterprise';
  const isCurrent = !isNil(apiPlan) && apiPlan.id === currentPlanId;
  const isOnPaidPlan =
    !isNil(currentPlanId) && currentPlanId !== planSelectorUtils.FREE_PLAN_ID;

  const chargeAmount = isNil(apiPlan?.price)
    ? apiPlan?.priceDisplay ?? ''
    : `$${apiPlan.price.toLocaleString()}`;
  const handleCtaCheckout = (planId: string, action: CheckoutAction) =>
    onCheckout({
      planId,
      action,
      planName: t(entry.name),
      priceAmount: chargeAmount,
      features: entry.features.map((feature) => feature.label),
    });

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border p-5',
        entry.highlighted && 'border-primary shadow-sm',
      )}
    >
      <div className="flex flex-col gap-2">
        <h3
          className={cn(
            'text-lg font-semibold',
            entry.highlighted && 'text-primary',
          )}
        >
          {t(entry.name)}
        </h3>
        <p className="text-sm text-muted-foreground">{t(entry.blurb)}</p>
      </div>

      <div className="flex min-h-[3.25rem] flex-col gap-1">
        {!isNil(pricing) && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{pricing.amount}</span>
              {!isNil(pricing.suffix) && (
                <span className="text-sm text-muted-foreground">
                  {pricing.suffix}
                </span>
              )}
              {!isNil(pricing.savePercent) && (
                <Badge variant="accent" className="rounded-sm">
                  {t('Save {percent}%', { percent: pricing.savePercent })}
                </Badge>
              )}
            </div>
            {!isNil(pricing.annualNote) && (
              <span className="text-xs text-muted-foreground">
                {pricing.annualNote}
              </span>
            )}
          </>
        )}
      </div>

      <PlanCta
        isFree={isFree}
        isEnterprise={isEnterprise}
        isCurrent={isCurrent}
        isOnPaidPlan={isOnPaidPlan}
        hasScheduledChange={hasScheduledChange}
        isReactivating={isReactivating}
        highlighted={entry.highlighted}
        apiPlan={apiPlan}
        currentPlanId={currentPlanId}
        isPending={isPending}
        checkoutPlanId={checkoutPlanId}
        onCheckout={handleCtaCheckout}
        onKeepPlan={onKeepPlan}
        onDowngrade={onDowngrade}
      />

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium">{t(entry.featuresHeader)}</span>
        <ul className="flex flex-col gap-2.5">
          {entry.features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Check className="size-4 shrink-0 text-primary" />
              <span className="flex-1">{t(feature.label)}</span>
              {!isNil(feature.tooltip) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 shrink-0 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px]">
                    {t(feature.tooltip)}
                  </TooltipContent>
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PlanCta({
  isFree,
  isEnterprise,
  isCurrent,
  isOnPaidPlan,
  hasScheduledChange,
  isReactivating,
  highlighted,
  apiPlan,
  currentPlanId,
  isPending,
  checkoutPlanId,
  onCheckout,
  onKeepPlan,
  onDowngrade,
}: PlanCtaProps) {
  if (isEnterprise) {
    return (
      <Button variant="default" className="w-full bg-foreground" asChild>
        <a
          href={planSelectorUtils.SALES_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Talk to sales')}
        </a>
      </Button>
    );
  }

  if (isCurrent) {
    if (hasScheduledChange) {
      return (
        <Button
          variant="default"
          className="w-full"
          loading={isReactivating}
          onClick={onKeepPlan}
        >
          {t('Keep current plan')}
        </Button>
      );
    }
    return (
      <Button variant="outline" className="w-full" disabled>
        {t('Current plan')}
      </Button>
    );
  }

  if (isFree) {
    if (!isOnPaidPlan) {
      return (
        <Button variant="outline" className="w-full" disabled>
          {t('Current plan')}
        </Button>
      );
    }
    return (
      <ConfirmationDeleteDialog
        title={t('Downgrade to the Free plan')}
        message={t(DROP_TO_FREE_MESSAGE)}
        warning={t(DROP_TO_FREE_WARNING)}
        buttonText={t('Downgrade to Free')}
        entityName={t('subscription')}
        mutationFn={onDowngrade}
      >
        <Button variant="outline" className="w-full">
          {t('Downgrade')}
        </Button>
      </ConfirmationDeleteDialog>
    );
  }

  if (isNil(apiPlan)) {
    return null;
  }
  const action = planSelectorUtils.actionFor({ currentPlanId });
  return (
    <Button
      variant={highlighted ? 'default' : 'outline'}
      className="w-full"
      disabled={isPending}
      loading={apiPlan.id === checkoutPlanId}
      onClick={() => onCheckout(apiPlan.id, action)}
    >
      {t('Purchase Now')}
    </Button>
  );
}

type PlanSelectorProps = {
  enabled: boolean;
  onSelected?: () => void;
};

type PlanColumnProps = {
  entry: PlanCatalogEntry;
  apiPlan?: PurchasablePlan;
  pricing: PlanPricing | null;
  currentPlanId: string | null | undefined;
  hasScheduledChange: boolean;
  isReactivating: boolean;
  isPending: boolean;
  checkoutPlanId: string | undefined;
  onCheckout: (intent: CheckoutIntent) => void;
  onKeepPlan: () => void;
  onDowngrade: () => Promise<void>;
};

type PlanCtaProps = {
  isFree: boolean;
  isEnterprise: boolean;
  isCurrent: boolean;
  isOnPaidPlan: boolean;
  hasScheduledChange: boolean;
  isReactivating: boolean;
  highlighted?: boolean;
  apiPlan?: PurchasablePlan;
  currentPlanId: string | null | undefined;
  isPending: boolean;
  checkoutPlanId: string | undefined;
  onCheckout: (planId: string, action: CheckoutAction) => void;
  onKeepPlan: () => void;
  onDowngrade: () => Promise<void>;
};

type CheckoutIntent = {
  planId: string;
  action: CheckoutAction;
  planName: string;
  priceAmount: string;
  features: string[];
};
