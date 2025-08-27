import { t } from 'i18next';
import { CheckIcon, Crown, Sparkle, StarIcon, Zap } from 'lucide-react';
import { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BillingCycle, PlanName } from '@activepieces/ee-shared';
import { isNil } from '@activepieces/shared';

import { planData } from './data';

export const PlanSelectionStep: FC<{
  selectedPlan: string;
  currentPlan: string;
  selectedCycle: BillingCycle;
  onPlanSelect: (plan: string) => void;
}> = ({ selectedPlan, currentPlan, selectedCycle, onPlanSelect }) => {
  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case PlanName.FREE:
        return <Sparkle className="h-5 w-5" />;
      case PlanName.PLUS:
        return <Zap className="h-5 w-5" />;
      case PlanName.BUSINESS:
        return <Crown className="h-5 w-5" />;
      default:
        return <Sparkle className="h-5 w-5" />;
    }
  };

  const availablePlans = planData.plans.filter(
    (plan) => plan.name !== PlanName.ENTERPRISE,
  );

  const getInheritedFeatures = (currentPlanIndex: number) => {
    let allFeatures: (typeof planData.features)[0][] = [];

    for (let i = 0; i <= currentPlanIndex; i++) {
      const plan = availablePlans[i];
      const planFeatures = planData.features.filter((feature) => {
        const featureValue =
          feature.values[plan.name as keyof typeof feature.values];
        return (
          !isNil(featureValue) &&
          (typeof featureValue !== 'boolean' || featureValue === true)
        );
      });
      allFeatures = [...allFeatures, ...planFeatures];
    }

    const uniqueFeatures = allFeatures.filter(
      (feature, index, self) =>
        index === self.findIndex((f) => f.key === feature.key),
    );

    return uniqueFeatures;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto h-full">
      {availablePlans.map((plan, index) => {
        const isSelected = selectedPlan === plan.name;
        const isPopular = plan.name === PlanName.PLUS;
        const isFree = currentPlan === PlanName.FREE;
        const inheritedFeatures = getInheritedFeatures(index);
        const hightlightPlan =
          isPopular && selectedPlan !== plan.name && isFree;

        return (
          <Card
            key={plan.name}
            className={cn(
              'relative cursor-pointer transition-all duration-200 hover:shadow-md',
              isSelected && 'ring-2 ring-primary shadow-lg',
              hightlightPlan && 'border-primary/50',
            )}
            onClick={() => onPlanSelect(plan.name)}
          >
            {hightlightPlan && (
              <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                <Badge className="px-2 py-1 text-xs bg-primary">
                  <StarIcon className="h-3 w-3 mr-1 fill-current" />
                  {t('Popular')}
                </Badge>
              </div>
            )}

            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-start justify-start gap-3">
                    <div className="flex justify-start items-center gap-2">
                      {getPlanIcon(plan.name)}
                      <h3 className="text-xl font-bold">
                        {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight">
                      ${plan.price[selectedCycle]}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{t('month')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {index > 0 && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Everything in{' '}
                      {availablePlans[index - 1].name.charAt(0).toUpperCase() +
                        availablePlans[index - 1].name.slice(1)}
                      , plus:
                    </div>
                  )}

                  {inheritedFeatures.map((feature) => {
                    const featureValue =
                      feature.values[plan.name as keyof typeof feature.values];
                    if (isNil(featureValue)) return null;

                    return (
                      <div
                        key={feature.key}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                            <CheckIcon
                              className="h-2.5 w-2.5 text-foreground"
                              strokeWidth={2.5}
                            />
                          </div>
                        </div>
                        <div className="flex-1 leading-relaxed">
                          {typeof featureValue !== 'boolean' && (
                            <span className="font-semibold text-foreground mr-1">
                              {featureValue}
                            </span>
                          )}
                          <span>
                            {featureValue === '1'
                              ? feature.label.slice(0, -1)
                              : feature.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
