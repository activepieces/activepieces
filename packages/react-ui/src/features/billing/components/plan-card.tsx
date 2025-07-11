import { t } from 'i18next';
import { CheckIcon, XIcon, Loader2Icon, StarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { billingMutations } from '@/features/billing/lib/billing-hooks';
import { planData } from '@/features/billing/lib/data';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared';
import { isNil, PlatformBillingInformation } from '@activepieces/shared';

type PlanCardProps = {
  plan: (typeof planData.plans)[0];
  billingInformation?: PlatformBillingInformation;
  setDialogOpen: (open: boolean) => void;
};

export const PlanCard = ({
  plan,
  billingInformation,
  setDialogOpen,
}: PlanCardProps) => {
  const openNewWindow = useNewWindow();
  const currentPlan = billingInformation?.plan.plan || PlanName.FREE;
  const isTrial =
    billingInformation?.plan.stripeSubscriptionStatus ===
    ApSubscriptionStatus.TRIALING;

  const isSelected =
    (currentPlan === plan.name && !isTrial) ||
    (isTrial && plan.name === PlanName.FREE);
  const isPopular = plan.name === PlanName.PLUS && !isSelected;

  const { mutate: updateSubscription, isPending: isUpdatingSubscription } =
    billingMutations.useUpdateSubscription(() => setDialogOpen(false));
  const { mutate: createSubscription, isPending: isCreatingSubscripton } =
    billingMutations.useCreateSubscription(() => setDialogOpen(false));

  const hasActiveSubscription =
    billingInformation?.plan.stripeSubscriptionStatus ===
    ApSubscriptionStatus.ACTIVE;
  const isEnterprisePlan = plan.name === PlanName.ENTERPRISE;

  const getButtonText = () => {
    if (isUpdatingSubscription) return t('Updating...');
    if (isSelected) return t('Current Plan');
    if (isEnterprisePlan) return t('Contact Sales');
    return t('Select');
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-background p-6',
        isPopular && 'ring-2 ring-primary',
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            variant="ghost"
            className="bg-accent text-foreground px-3 py-1 text-xs font-medium"
          >
            <StarIcon className="mr-1 h-3 w-3 fill-current" />
            {t('Most Popular')}
          </Badge>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">
          {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className="py-4">
        {plan.price === 'Custom' ? (
          <div className="text-3xl font-bold tracking-tight">{t('Custom')}</div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              ${plan.price}
            </span>
            <span className="text-muted-foreground text-sm font-medium">
              /month
            </span>
          </div>
        )}
      </div>

      <Button
        variant="default"
        className="w-full font-semibold transition-all"
        onClick={() => {
          if (isEnterprisePlan) {
            openNewWindow('https://activepieces.com/sales');
          } else if (!isSelected) {
            if (hasActiveSubscription) {
              updateSubscription({
                plan: plan.name as
                  | PlanName.PLUS
                  | PlanName.BUSINESS
                  | PlanName.FREE,
              });
            } else {
              createSubscription({
                plan: plan.name as PlanName.PLUS | PlanName.BUSINESS,
              });
            }
          }
        }}
        disabled={isUpdatingSubscription || isSelected || isCreatingSubscripton}
      >
        {isUpdatingSubscription ||
          (isCreatingSubscripton && (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ))}
        {getButtonText()}
      </Button>

      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          {plan.featuresTitle}
        </h4>
        <ul className="space-y-2">
          {planData.features.map((feature) => {
            const featureValue =
              feature.values[plan.name as keyof typeof feature.values];
            if (isNil(featureValue)) return null;

            const isIncluded =
              typeof featureValue !== 'boolean' || featureValue === true;

            return (
              <li key={feature.key} className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 flex-shrink-0">
                  {isIncluded ? (
                    <CheckIcon
                      className="h-4 w-4 text-emerald-600"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <XIcon
                      className="h-4 w-4 text-muted-foreground/60"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 leading-relaxed',
                    !isIncluded && 'text-muted-foreground',
                  )}
                >
                  {isIncluded && typeof featureValue !== 'boolean' && (
                    <span className="font-medium text-foreground me-1">
                      {featureValue}
                    </span>
                  )}
                  <span>
                    {featureValue === '1'
                      ? feature.label.slice(0, -1)
                      : feature.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
