import { t } from 'i18next';
import { CheckIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import { PlanName, UpdateSubscriptionParams } from '@activepieces/ee-shared';

import { planData } from '../data';

type PlanCardProps = {
  plan: (typeof planData.plans)[0];
  selected: PlanName;
  onUpgrade: (params: UpdateSubscriptionParams) => void;
};

export const PlanCard = ({ plan, selected, onUpgrade }: PlanCardProps) => {
  const openNewWindow = useNewWindow();
  const selectedPlan = selected === plan.name;

  const [isUsersExpanded, setIsUsersExpanded] = useState(false);
  const [additionalUsers, setAdditionalUsers] = useState(0);

  const isBusinessPlan = plan.name === PlanName.BUSINESS;
  const isEnterprisePlan = plan.name === PlanName.ENTERPRISE;

  const baseUsers = 5;
  const maxUsers = 30;
  const additionalUserCost = 10;
  const extraUsers = additionalUsers;
  const totalPrice =
    typeof plan.price === 'number'
      ? plan.price + extraUsers * additionalUserCost
      : plan.price;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg p-4 transition border gap-4',
        selectedPlan && 'ring-2 ring-primary',
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold">
            {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
          </h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold">
          {plan.price === 'Custom' ? (
            'Custom'
          ) : (
            <>
              ${isBusinessPlan && extraUsers > 0 ? totalPrice : plan.price}
              <span className="text-sm text-muted-foreground ml-1">/mo</span>
              {isBusinessPlan && extraUsers > 0 && (
                <span className="text-xs text-muted-foreground ml-2">
                  (+${extraUsers * additionalUserCost} for {extraUsers} extra
                  users)
                </span>
              )}
            </>
          )}
        </span>
      </div>

      <Button
        size="sm"
        className="font-semibold"
        variant={selectedPlan ? 'outline' : 'default'}
        disabled={selectedPlan}
        onClick={() => {
          if (isEnterprisePlan) {
            openNewWindow('https://activepieces.com/sales');
          } else {
            onUpgrade({
              plan: plan.name as
                | PlanName.FREE
                | PlanName.PLUS
                | PlanName.BUSINESS,
              extraUsers: additionalUsers,
            });
          }
        }}
      >
        {selectedPlan
          ? t('Contact Sales')
          : isEnterprisePlan
          ? t('Current Plan')
          : t('Upgrade')}
      </Button>

      <div>
        <p className="text-sm font-bold mb-3">{t('Includes')}</p>
        <ul className="space-y-1">
          {planData.features.map((feature) => (
            <li key={feature.key} className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  {typeof feature.values[plan.name] === 'boolean' ? (
                    <XIcon className="h-4 w-4 text-red-500" strokeWidth={3} />
                  ) : (
                    <CheckIcon
                      className="h-4 w-4 text-green-600"
                      strokeWidth={3}
                    />
                  )}

                  <div className="flex items-center gap-2">
                    {typeof feature.values[plan.name] !== 'boolean' && (
                      <span>{feature.values[plan.name]}</span>
                    )}
                    <span>{feature.label}</span>
                  </div>
                </div>
                {isBusinessPlan && feature.key === 'users' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUsersExpanded(!isUsersExpanded);
                    }}
                    className="text-primary hover:text-primary/80  text-xs ml-2 flex items-center gap-1 transition-colors"
                  >
                    Need more?
                    <div className="transition-transform duration-200">
                      {isUsersExpanded ? (
                        <ChevronUpIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              <div
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out',
                  isBusinessPlan && feature.key === 'users' && isUsersExpanded
                    ? 'max-h-20 opacity-100'
                    : 'max-h-0 opacity-0',
                )}
              >
                {isBusinessPlan && feature.key === 'users' && (
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{additionalUsers + baseUsers} users total</span>
                      <span>+{extraUsers} extra</span>
                    </div>
                    <Slider
                      value={[additionalUsers]}
                      onValueChange={(value) => setAdditionalUsers(value[0])}
                      max={maxUsers}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
