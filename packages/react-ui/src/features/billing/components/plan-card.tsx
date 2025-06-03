import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckIcon, XIcon, Loader2Icon, StarIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { billingMutations } from '@/features/billing/lib/billing-hooks';
import { planData } from '@/features/billing/lib/data';
import { useDialogStore } from '@/lib/dialogs-store';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import {
  ApSubscriptionStatus,
  CreateSubscriptionParams,
  PlanName,
} from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

type PlanCardProps = {
  plan: (typeof planData.plans)[0];
  billingInformation?: PlatformBillingInformation;
};

export const PlanCard = ({ plan, billingInformation }: PlanCardProps) => {
  const queryClient = useQueryClient();
  const openNewWindow = useNewWindow();
  const { setDialog } = useDialogStore();
  const currentPlan = billingInformation?.plan.plan || PlanName.FREE;
  const isSelected = currentPlan === plan.name;
  const isPopular = plan.name === PlanName.PLUS && !isSelected;

  const { mutate: updateSubscription, isPending: isUpdatingSubscription } =
    billingMutations.useUpdateSubscription(
      () => setDialog('managePlan', false),
      queryClient,
    );
  const { mutate: createSubscription } = billingMutations.useCreateSubscription(
    () => setDialog('managePlan', false),
  );

  const hasActiveSubscription =
    billingInformation?.plan.stripeSubscriptionStatus ===
    ApSubscriptionStatus.ACTIVE;
  const isEnterprisePlan = plan.name === PlanName.ENTERPRISE;

  const handleSelect = (params: CreateSubscriptionParams) => {
    if (!hasActiveSubscription) {
      createSubscription(params);
    } else {
      updateSubscription({ plan: params.plan });
    }
  };

  const getButtonText = () => {
    if (isUpdatingSubscription) return t('Updating...');
    if (isSelected) return t('Current Plan');
    if (isEnterprisePlan) return t('Contact Sales');
    return t('Select');
  };

  const getButtonVariant = () => {
    if (isSelected) return 'outline' as const;
    if (isEnterprisePlan) return 'default' as const;
    return 'outline' as const;
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-6',
        isSelected && 'ring-2 ring-primary border-transparent ring-offset-2',
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
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
        variant={getButtonVariant()}
        className="w-full font-semibold transition-all"
        onClick={() => {
          if (isEnterprisePlan) {
            openNewWindow('https://activepieces.com/sales');
          } else if (!isSelected) {
            handleSelect({
              plan: plan.name as
                | PlanName.FREE
                | PlanName.PLUS
                | PlanName.BUSINESS,
            });
          }
        }}
        disabled={isUpdatingSubscription || isSelected}
      >
        {isUpdatingSubscription && (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        )}
        {getButtonText()}
      </Button>

      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          {t("What's included")}
        </h4>
        <ul className="space-y-3">
          {planData.features.map((feature) => {
            const featureValue = feature.values[plan.name];
            const isIncluded =
              typeof featureValue !== 'boolean' || featureValue === true;

            return (
              <li key={feature.key} className="flex items-start gap-3 text-sm">
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
                    <span className="font-medium text-foreground mr-2">
                      {featureValue}
                    </span>
                  )}
                  <span>{feature.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
