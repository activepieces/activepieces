import { t } from 'i18next';
import { ChevronLeft, TicketPercent } from 'lucide-react';
import { FC } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { BillingCycle, PlanName } from '@activepieces/ee-shared';

import {
  planData,
  DEFAULT_ACTIVE_FLOWS,
  DEFAULT_PROJECTS,
  DEFAULT_SEATS,
} from './data';

import {
  ActionConfig,
  CurrentPlanInfo,
  DialogState,
  PricingCalculation,
} from '.';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);

export const SubscriptionSummary: FC<{
  dialogState: DialogState;
  currentPlanInfo: CurrentPlanInfo;
  pricing: PricingCalculation;
  actionConfig: ActionConfig;
  isLoading: boolean;
  onCycleChange: (cycle: BillingCycle) => void;
  onStepChange: (step: number) => void;
  onActionClick: () => void;
}> = ({
  dialogState,
  currentPlanInfo,
  pricing,
  actionConfig,
  isLoading,
  onCycleChange,
  onStepChange,
  onActionClick,
}) => {
  const {
    selectedPlan,
    selectedCycle,
    selectedSeats,
    selectedActiveFlows,
    selectedProjects,
    currentStep,
  } = dialogState;

  const plan = planData.plans.find(
    (p: (typeof planData.plans)[0]) => p.name === selectedPlan,
  );

  return (
    <div className="w-80 min-h-full flex flex-col bg-muted/20 border-l">
      <div className="p-2 h-16 flex justify-center items-center border-b bg-background">
        <h3 className="text-lg font-semibold text-center">
          {t('Subscription Summary')}
        </h3>
      </div>

      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        <RadioGroup
          value={selectedCycle}
          onValueChange={(value: BillingCycle) => onCycleChange(value)}
          className="grid grid-cols-2 gap-2"
        >
          <Label
            htmlFor="monthly"
            className="flex items-center space-x-2 cursor-pointer border rounded-lg p-3"
          >
            <RadioGroupItem value={BillingCycle.MONTHLY} id="monthly" />
            <p className="text-sm flex-1">Monthly</p>
          </Label>
          <Label
            htmlFor="annual"
            className="flex items-center space-x-2 border rounded-lg p-3 relative cursor-pointer"
          >
            <RadioGroupItem value={BillingCycle.ANNUAL} id="annual" />
            <p className="text-sm flex-1">Annual</p>
            <Badge
              variant="accent"
              className="text-xs absolute -top-1 -right-2 bg-green-600"
            >
              -24%
            </Badge>
          </Label>
        </RadioGroup>

        {selectedPlan && plan && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="font-medium">
                  <div>
                    {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('Plan')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {formatPrice(pricing.basePlanPrice)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    /{t('month')}
                  </div>
                </div>
              </div>
            </div>

            {pricing.totalAddonCost > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="text-sm font-medium">Add-ons</div>

                  {pricing.addonCosts.seats > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>
                        Extra User Seats ({selectedSeats[0] - DEFAULT_SEATS})
                      </span>
                      <span>
                        {formatPrice(pricing.addonCosts.seats)} /month
                      </span>
                    </div>
                  )}

                  {pricing.addonCosts.flows > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>
                        Extra Active Flows (
                        {selectedActiveFlows[0] -
                          (DEFAULT_ACTIVE_FLOWS[
                            selectedPlan as PlanName.PLUS | PlanName.BUSINESS
                          ] ?? 10)}
                        )
                      </span>
                      <span>
                        {formatPrice(pricing.addonCosts.flows)} /month
                      </span>
                    </div>
                  )}

                  {pricing.addonCosts.projects > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>
                        Extra Projects ({selectedProjects[0] - DEFAULT_PROJECTS}
                        )
                      </span>
                      <span>
                        {formatPrice(pricing.addonCosts.projects)} /month
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between text-xl items-center font-semibold">
                <p>
                  {t(
                    `${
                      selectedCycle === BillingCycle.MONTHLY
                        ? 'Monthly'
                        : 'Annual'
                    } Total`,
                  )}
                </p>
                <p>{formatPrice(pricing.totalPrice)}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-left whitespace-nowrap flex-nowrap">
                <TicketPercent
                  className="w-4 h-4 -rotate-45 shrink-0"
                  strokeWidth={1.5}
                />
                <span>
                  {selectedCycle === BillingCycle.ANNUAL ? 'You saved' : 'Save'}{' '}
                  <span className="inline font-semibold">
                    {formatPrice(pricing.annualSavings)}
                  </span>{' '}
                  with{' '}
                  {selectedCycle === BillingCycle.ANNUAL ? (
                    'Annual Billing'
                  ) : (
                    <Button
                      variant="link"
                      onClick={() => onCycleChange(BillingCycle.ANNUAL)}
                      className="p-0"
                    >
                      {t('Annual Billing')}
                    </Button>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex gap-x-2 items-center">
        {currentStep === 2 && (
          <Button variant="outline" onClick={() => onStepChange(1)}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        <Button
          className="flex-1"
          onClick={onActionClick}
          disabled={actionConfig.disabled || isLoading}
        >
          {isLoading ? (
            t('Processing...')
          ) : (
            <>
              {actionConfig.label}
              {actionConfig.icon}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
