import { t } from 'i18next';
import {
  CheckIcon,
  Crown,
  Info,
  Sparkle,
  StarIcon,
  Zap,
  ChevronRight,
  ChevronLeft,
  TicketPercent,
} from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';
import {
  ApSubscriptionStatus,
  BillingCycle,
  PlanName,
} from '@activepieces/ee-shared';
import { isNil, PlatformUsageMetric } from '@activepieces/shared';

import { billingQueries } from '../../lib/billing-hooks';
import { planData } from '../../lib/data';

import { useManagePlanDialogStore } from './store';

const MAX_SEATS = 20;
const DEFAULT_SEATS = 5;
const MAX_ACTIVE_FLOWS_PLUS = 40;
const MAX_ACTIVE_FLOWS_BUSINESS = 100;
const DEFAULT_ACTIVE_FLOWS_MAP = {
  [PlanName.BUSINESS]: 50,
  [PlanName.PLUS]: 10,
};
const MAX_PROJECTS = 30;
const DEFAULT_PROJECTS = 10;

const ADDON_PRICES = {
  USER_SEAT: {
    [BillingCycle.MONTHLY]: 15,
    [BillingCycle.ANNUAL]: 11.4,
  },
  ACTIVE_FLOWS: {
    [BillingCycle.MONTHLY]: 15,
    [BillingCycle.ANNUAL]: 11.4,
  },
  PROJECT: {
    [BillingCycle.MONTHLY]: 10,
    [BillingCycle.ANNUAL]: 7.6,
  },
};

const getMaxActiveFlows = (plan?: string) => {
  if (plan === PlanName.PLUS) return MAX_ACTIVE_FLOWS_PLUS;
  if (plan === PlanName.BUSINESS) return MAX_ACTIVE_FLOWS_BUSINESS;
  return MAX_ACTIVE_FLOWS_PLUS;
};

const Stepper: FC<{
  currentStep: number;
  steps: { title: string }[];
}> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                index + 1 <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                index + 1 <= currentStep
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-6" />
          )}
        </div>
      ))}
    </div>
  );
};

const PlanSelectionStep: FC<{
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedCycle: BillingCycle;
}> = ({ selectedPlan, setSelectedPlan, selectedCycle }) => {
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
    let allFeatures: any[] = [];

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
        const inheritedFeatures = getInheritedFeatures(index);

        return (
          <Card
            key={plan.name}
            className={cn(
              'relative cursor-pointer transition-all duration-200 hover:shadow-md',
              isSelected && 'ring-2 ring-primary shadow-lg',
              isPopular && 'border-primary/50',
            )}
            onClick={() => setSelectedPlan(plan.name)}
          >
            {isPopular && (
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

interface AddonSliderProps {
  title: string;
  description: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  max: number;
  min: number;
  step: number;
  currentLimit: number;
  unit: string;
}

const AddonSlider: FC<AddonSliderProps> = ({
  title,
  description,
  value,
  onValueChange,
  max,
  min,
  step,
  currentLimit,
  unit,
}) => {
  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/10">
      <div className="flex items-center gap-2">
        <h4 className="text-base font-semibold">{title}</h4>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Total {unit}s</label>
          <div className="text-base font-bold px-3 py-1 bg-primary/10 rounded-md">
            {value[0]}
          </div>
        </div>

        <div className="space-y-4">
          <Slider
            value={value}
            onValueChange={onValueChange}
            max={max}
            min={min}
            step={step}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t(`${min} ${unit}s (min)`)}</span>
            <span>{t(`${max} ${unit}s (max)`)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddonsStep: FC<{
  platformBillingInformation: any;
  selectedSeats: number[];
  setSelectedSeats: (value: number[]) => void;
  selectedActiveFlows: number[];
  setSelectedActiveFlows: (value: number[]) => void;
  selectedProjects: number[];
  setSelectedProjects: (value: number[]) => void;
}> = ({
  platformBillingInformation,
  selectedSeats,
  setSelectedSeats,
  selectedActiveFlows,
  setSelectedActiveFlows,
  selectedProjects,
  setSelectedProjects,
}) => {
  const currentUserLimit =
    platformBillingInformation?.plan.userSeatsLimit ?? DEFAULT_SEATS;
  const DEFAULT_ACTIVE_FLOWS =
    DEFAULT_ACTIVE_FLOWS_MAP[
      platformBillingInformation?.plan.plan as PlanName.PLUS | PlanName.BUSINESS
    ] ?? 10;
  const currentActiveFlowLimit =
    platformBillingInformation?.plan.activeFlowsLimit ?? DEFAULT_ACTIVE_FLOWS;
  const currentProjectLimit =
    platformBillingInformation?.plan.projectsLimit ?? DEFAULT_PROJECTS;
  const maxActiveFlows = getMaxActiveFlows(
    platformBillingInformation?.plan.plan,
  );

  return (
    <div className="grid grid-rows-3 h-full gap-4">
      <AddonSlider
        title={t('User Seats')}
        description={t('Add more team members to your workspace')}
        value={selectedSeats}
        onValueChange={setSelectedSeats}
        max={MAX_SEATS}
        min={DEFAULT_SEATS}
        step={1}
        currentLimit={currentUserLimit}
        unit="seat"
      />

      <AddonSlider
        title={t('Active Flows')}
        description={t('Increase your automation capacity')}
        value={selectedActiveFlows}
        onValueChange={setSelectedActiveFlows}
        max={maxActiveFlows}
        min={DEFAULT_ACTIVE_FLOWS}
        step={5}
        currentLimit={currentActiveFlowLimit}
        unit="flow"
      />

      <AddonSlider
        title={t('Projects')}
        description={t('Organize your work with more projects')}
        value={selectedProjects}
        onValueChange={setSelectedProjects}
        max={MAX_PROJECTS}
        min={DEFAULT_PROJECTS}
        step={1}
        currentLimit={currentProjectLimit}
        unit="project"
      />
    </div>
  );
};

const calculatePrice = (
  selectedPlan: string,
  selectedCycle: BillingCycle,
  selectedSeats: number[],
  selectedActiveFlows: number[],
  selectedProjects: number[],
  planData: any,
) => {
  const plan = planData.plans.find((p: any) => p.name === selectedPlan);
  const basePlanPrice = plan ? parseFloat(plan.price[selectedCycle]) : 0;

  const extraSeats = selectedSeats[0] - DEFAULT_SEATS;
  const extraFlows =
    selectedActiveFlows[0] -
    DEFAULT_ACTIVE_FLOWS_MAP[selectedPlan as PlanName.PLUS | PlanName.BUSINESS];
  const extraProjects = selectedProjects[0] - DEFAULT_PROJECTS;

  const addonCosts = {
    seats: Math.max(0, extraSeats * ADDON_PRICES.USER_SEAT[selectedCycle]),
    flows: Math.max(
      0,
      Math.ceil(extraFlows / 5) * ADDON_PRICES.ACTIVE_FLOWS[selectedCycle],
    ),
    projects: Math.max(0, extraProjects * ADDON_PRICES.PROJECT[selectedCycle]),
  };

  const totalAddonCost =
    addonCosts.seats + addonCosts.flows + addonCosts.projects;
  const monthlyPrice = basePlanPrice + totalAddonCost;
  const annualPrice = (basePlanPrice + totalAddonCost) * 12;
  const annualSavings =
    selectedCycle === BillingCycle.ANNUAL
      ? annualPrice / (1 - 0.24) - annualPrice
      : annualPrice * 0.24;

  return {
    basePlanPrice,
    addonCosts,
    totalAddonCost,
    totalPrice:
      selectedCycle === BillingCycle.MONTHLY ? monthlyPrice : annualPrice,
    annualSavings,
  };
};

const SubscriptionSummary: FC<{
  selectedPlan: string;
  selectedCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  selectedSeats: number[];
  selectedActiveFlows: number[];
  selectedProjects: number[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
}> = ({
  selectedPlan,
  selectedCycle,
  onCycleChange,
  selectedSeats,
  selectedActiveFlows,
  selectedProjects,
  currentStep,
  onNext,
  onBack,
  canGoNext,
}) => {
  const pricing = calculatePrice(
    selectedPlan,
    selectedCycle,
    selectedSeats,
    selectedActiveFlows,
    selectedProjects,
    planData,
  );

  const plan = planData.plans.find((p: any) => p.name === selectedPlan);

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
            <p className="text-sm  flex-1">Monthly</p>
          </Label>
          <Label
            htmlFor="annual"
            className="flex items-center space-x-2 border rounded-lg p-3 relative cursor-pointer "
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
                    ${pricing.basePlanPrice}
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
                      <span>${pricing.addonCosts.seats.toFixed(2)} /month</span>
                    </div>
                  )}

                  {pricing.addonCosts.flows > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>
                        Extra Active Flows (
                        {selectedActiveFlows[0] -
                          (DEFAULT_ACTIVE_FLOWS_MAP[
                            selectedPlan as PlanName.PLUS | PlanName.BUSINESS
                          ] ?? 10)}
                        )
                      </span>
                      <span>${pricing.addonCosts.flows.toFixed(2)} /month</span>
                    </div>
                  )}

                  {pricing.addonCosts.projects > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>
                        Extra Projects ({selectedProjects[0] - DEFAULT_PROJECTS}
                        )
                      </span>
                      <span>
                        ${pricing.addonCosts.projects.toFixed(2)} /month
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
                <p>${pricing.totalPrice.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-left whitespace-nowrap flex-nowrap">
                <TicketPercent
                  className="w-4 h-4 -rotate-45 shrink-0"
                  strokeWidth={1.5}
                />
                <span>
                  {selectedCycle === BillingCycle.ANNUAL ? 'You saved' : 'Save'}{' '}
                  <span className="inline font-semibold">
                    ${pricing.annualSavings.toFixed(0)}
                  </span>{' '}
                  with{' '}
                  {selectedCycle === BillingCycle.ANNUAL ? (
                    'annual billing'
                  ) : (
                    <button
                      onClick={() => onCycleChange(BillingCycle.ANNUAL)}
                      className="text-primary underline hover:text-primary/80 transition-colors"
                    >
                      annual billing
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex gap-x-2 items-center">
        {currentStep === 2 && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={onNext} disabled={!canGoNext}>
          {currentStep === 1 ? (
            <>
              {t('Configure Add-ons')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            t('Checkout')
          )}
        </Button>
      </div>
    </div>
  );
};

export const UpgradeDialog: FC = () => {
  const { dialog, closeDialog } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY,
  );
  const [selectedPlan, setSelectedPlan] = useState<string>(PlanName.FREE);

  const currentUserLimit =
    platformBillingInformation?.plan.userSeatsLimit ?? DEFAULT_SEATS;
  const DEFAULT_ACTIVE_FLOWS =
    DEFAULT_ACTIVE_FLOWS_MAP[
      platformBillingInformation?.plan.plan as PlanName.PLUS | PlanName.BUSINESS
    ] ?? 10;
  const currentActiveFlowLimit =
    platformBillingInformation?.plan.activeFlowsLimit ?? DEFAULT_ACTIVE_FLOWS;
  const currentProjectLimit =
    platformBillingInformation?.plan.projectsLimit ?? DEFAULT_PROJECTS;

  const [selectedSeats, setSelectedSeats] = useState([currentUserLimit]);
  const [selectedActiveFlows, setSelectedActiveFlows] = useState([
    currentActiveFlowLimit,
  ]);
  const [selectedProjects, setSelectedProjects] = useState([
    currentProjectLimit,
  ]);

  useEffect(() => {
    const currentPlan = platformBillingInformation?.plan.plan || PlanName.FREE;
    const isTrial =
      platformBillingInformation?.plan.stripeSubscriptionStatus ===
      ApSubscriptionStatus.TRIALING;

    if (isTrial) {
      setSelectedPlan(PlanName.FREE);
    } else {
      setSelectedPlan(currentPlan);
    }
  }, [platformBillingInformation]);

  useEffect(() => {
    setSelectedSeats([currentUserLimit]);
  }, [currentUserLimit]);

  useEffect(() => {
    setSelectedActiveFlows([currentActiveFlowLimit]);
  }, [currentActiveFlowLimit]);

  useEffect(() => {
    setSelectedProjects([currentProjectLimit]);
  }, [currentProjectLimit]);

  const messages: Record<string, string> = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: t(
      'You have run out of active flows. Upgrade to get more.',
    ),
    [PlatformUsageMetric.MCPS]: t(
      'You have run out of MCP servers. Upgrade to get more.',
    ),
    [PlatformUsageMetric.TABLES]: t(
      'You have run out of tables. Upgrade to get more.',
    ),
    [PlatformUsageMetric.USER_SEATS]: t(
      'You have run out of user seats. Upgrade to get more.',
    ),
    [PlatformUsageMetric.AGENTS]: t('Upgrade to unlock agents.'),
  };

  const message = dialog.metric ? messages[dialog.metric] : undefined;
  const title = dialog.title || t('Choose Your Plan');

  const steps = [{ title: t('Select Plan') }, { title: t('Add-ons') }];

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      console.log('Update subscription', {
        selectedPlan,
        selectedSeats,
        selectedActiveFlows,
        selectedProjects,
        selectedCycle,
      });
      closeDialog();
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const canGoNext = currentStep === 1 ? selectedPlan !== '' : true;

  return (
    <Dialog
      open={dialog.isOpen}
      onOpenChange={(open) => !open && closeDialog()}
    >
      <DialogContent className="w-[90vw] max-w-6xl h-[750px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b m-0">
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
          {message && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm font-medium text-primary">
              <Sparkle className="h-4 w-4" />
              {message}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {platformBillingInformation?.plan.plan === PlanName.FREE ? (
            <div className="flex-1 p-4 overflow-y-auto">
              <PlanSelectionStep
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                selectedCycle={selectedCycle}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-2 h-16 items-center flex justify-center border-b bg-muted/20">
                <Stepper currentStep={currentStep} steps={steps} />
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {currentStep === 1 ? (
                  <PlanSelectionStep
                    selectedPlan={selectedPlan}
                    setSelectedPlan={setSelectedPlan}
                    selectedCycle={selectedCycle}
                  />
                ) : (
                  <AddonsStep
                    platformBillingInformation={platformBillingInformation}
                    selectedSeats={selectedSeats}
                    setSelectedSeats={setSelectedSeats}
                    selectedActiveFlows={selectedActiveFlows}
                    setSelectedActiveFlows={setSelectedActiveFlows}
                    selectedProjects={selectedProjects}
                    setSelectedProjects={setSelectedProjects}
                  />
                )}
              </div>
            </div>
          )}

          <SubscriptionSummary
            selectedPlan={selectedPlan}
            selectedCycle={selectedCycle}
            onCycleChange={setSelectedCycle}
            selectedSeats={selectedSeats}
            selectedActiveFlows={selectedActiveFlows}
            selectedProjects={selectedProjects}
            currentStep={currentStep}
            onNext={handleNext}
            onBack={handleBack}
            canGoNext={canGoNext}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
