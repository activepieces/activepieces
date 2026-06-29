import { isNil } from '@activepieces/core-utils';
import { PurchasablePlan } from '@activepieces/shared';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingMutations, billingQueries } from '../hooks/billing-hooks';

type PlanSelectorProps = {
  enabled: boolean;
  onSelected?: () => void;
};

export function PlanSelector({ enabled, onSelected }: PlanSelectorProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans, isLoading } = billingQueries.useListPlans(
    platform.id,
    enabled,
  );
  const { mutate: checkout, isPending } =
    billingMutations.useCheckout(onSelected);
  const { mutateAsync: cancelSubscription } =
    billingMutations.useCancelSubscription(onSelected);
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    enabled,
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
  const hasAnnualOption = purchasablePlans.some(
    (plan) => plan.interval === ANNUAL_INTERVAL,
  );

  const [cycleOverride, setCycleOverride] = useState<BillingCycle | null>(null);
  const billingCycle =
    cycleOverride ??
    (currentPlan?.interval === ANNUAL_INTERVAL ? 'year' : 'month');

  const visiblePlans = purchasablePlans.filter((plan) =>
    billingCycle === 'year'
      ? plan.interval === ANNUAL_INTERVAL
      : plan.interval !== ANNUAL_INTERVAL,
  );

  if (isLoading || isNil(plans)) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasAnnualOption && (
        <Tabs
          value={billingCycle}
          onValueChange={(value) => setCycleOverride(value as BillingCycle)}
          className="self-start"
        >
          <TabsList>
            <TabsTrigger value="month">{t('Monthly')}</TabsTrigger>
            <TabsTrigger value="year">{t('Yearly')}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visiblePlans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const savePercent =
            plan.interval === ANNUAL_INTERVAL
              ? annualSavePercent(
                  plan,
                  findMonthlySibling(plan, purchasablePlans),
                )
              : null;
          const features = planFeatures(plan);
          const action = actionFor(plan, currentPlanId, currentPlan);
          const ctaLabel = isCurrent
            ? t('Current plan')
            : action === 'downgrade'
            ? t('Switch to {plan}', { plan: displayName(plan) })
            : t('Upgrade to {plan}', { plan: displayName(plan) });
          return (
            <Item key={plan.id} variant="outline" className="items-start">
              <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                  {displayName(plan)}
                  {!isNil(savePercent) && (
                    <Badge variant="accent" className="rounded-sm">
                      {t('Save {percent}%', { percent: savePercent })}
                    </Badge>
                  )}
                </ItemTitle>
                <div className="text-base font-semibold text-foreground">
                  {priceLabel(plan)}
                </div>
                {features.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-2">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !isNil(plan.description) && (
                    <ItemDescription className="line-clamp-none">
                      {plan.description}
                    </ItemDescription>
                  )
                )}
              </ItemContent>
              <ItemActions>
                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  size="sm"
                  disabled={isCurrent || isPending}
                  onClick={() =>
                    checkout({
                      planId: plan.id,
                      successUrl: buildSuccessUrl(action),
                    })
                  }
                >
                  {ctaLabel}
                </Button>
              </ItemActions>
            </Item>
          );
        })}
      </div>
      {isOnSelfServePaidPlan && (
        <ConfirmationDeleteDialog
          title={t('Downgrade to the Free plan')}
          message={t(
            'This takes effect at the end of your current billing period.',
          )}
          warning={t(
            'Your workspace will move to the Free plan and lose its current limits and paid features (higher limits, SSO, global connections, custom roles). You keep your current plan until the period ends.',
          )}
          buttonText={t('Downgrade to Free')}
          entityName={t('subscription')}
          mutationFn={async () => {
            await cancelSubscription();
          }}
        >
          <Button variant="ghost" size="sm" className="self-start">
            {t('Downgrade to Free')}
          </Button>
        </ConfirmationDeleteDialog>
      )}
    </div>
  );
}

function priceLabel(plan: PurchasablePlan): string {
  if (isNil(plan.price)) {
    return plan.priceDisplay ?? t('Free');
  }
  const amount = plan.priceDisplay ?? `$${plan.price}`;
  if (plan.interval === ANNUAL_INTERVAL) {
    return `${amount}${t('/year')}`;
  }
  if (plan.interval === MONTHLY_INTERVAL) {
    return `${amount}${t('/month')}`;
  }
  return amount;
}

// The cycle is conveyed by the toggle, so drop a trailing "(Annual)" from the plan name for a clean title.
function displayName(plan: PurchasablePlan): string {
  return plan.name.replace(/\s*\(annual\)\s*/i, '').trim();
}

// Turn the plan's prose description into aligned feature bullets. Our descriptions read
// "<name/price intro>. <feat1>, <feat2>, …" — drop the intro sentence (it repeats the price) and split the
// rest on comma-then-space (so "10,000" stays intact). Returns [] when the format doesn't match, and the
// caller falls back to the raw description.
function planFeatures(plan: PurchasablePlan): string[] {
  if (isNil(plan.description)) {
    return [];
  }
  const introEnd = plan.description.indexOf('. ');
  if (introEnd === -1) {
    return [];
  }
  return plan.description
    .slice(introEnd + 2)
    .replace(/\.\s*$/, '')
    .split(/,\s+/)
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0)
    .map((feature) => {
      const expanded = FEATURE_GLOSSARY[feature.toUpperCase()] ?? feature;
      return expanded.charAt(0).toUpperCase() + expanded.slice(1);
    });
}

// Pair an annual plan to its monthly counterpart for the save-% badge: prefer Autumn's baseVariantId link,
// fall back to matching the cleaned display name (resilient when baseVariantId hasn't propagated yet).
function findMonthlySibling(
  annual: PurchasablePlan,
  plans: PurchasablePlan[],
): PurchasablePlan | undefined {
  if (!isNil(annual.baseVariantId)) {
    const linked = plans.find((plan) => plan.id === annual.baseVariantId);
    if (!isNil(linked)) {
      return linked;
    }
  }
  return plans.find(
    (plan) =>
      plan.interval !== ANNUAL_INTERVAL &&
      displayName(plan) === displayName(annual),
  );
}

// Discount the annual plan offers over paying monthly for a year, e.g. $20/mo vs $192/yr -> 20%.
// Null when either price is missing (custom/enterprise plans) or there is no real saving.
function annualSavePercent(
  annual: PurchasablePlan,
  monthly: PurchasablePlan | undefined,
): number | null {
  const annualPrice = annual.price;
  const monthlyPrice = monthly?.price;
  if (isNil(annualPrice) || isNil(monthlyPrice) || monthlyPrice <= 0) {
    return null;
  }
  const percent = Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  return percent > 0 ? percent : null;
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
const ANNUAL_INTERVAL = 'year';
const MONTHLY_INTERVAL = 'month';

// Expand opaque plan-feature abbreviations into plain language. Keyed by the upper-cased bullet text.
const FEATURE_GLOSSARY: Record<string, string> = {
  BYOK: 'Use your own AI provider keys for AI features (BYOK)',
};

type BillingCycle = 'month' | 'year';

type CheckoutAction = 'create' | 'upgrade' | 'downgrade';
