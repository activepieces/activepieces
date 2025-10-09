import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';

import {
  ApSubscriptionStatus,
  BillingCycle,
  PlanName,
  StripePlanName,
} from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

import {
  ADDON_PRICES,
  ANNUAL_DISCOUNT_PERCENTAGE,
  DEFAULT_ACTIVE_FLOWS,
  DEFAULT_PROJECTS,
  DEFAULT_SEATS,
  planData,
} from './data';

import {
  ActionConfig,
  ActionType,
  CurrentPlanInfo,
  DialogState,
  PricingCalculation,
} from '.';

export const getCurrentPlanInfo = (
  platformBillingInformation?: PlatformBillingInformation,
): CurrentPlanInfo => {
  const isTrial =
    platformBillingInformation?.plan.stripeSubscriptionStatus ===
    ApSubscriptionStatus.TRIALING;

  return {
    plan: isTrial
      ? PlanName.FREE
      : (platformBillingInformation?.plan.plan as PlanName),
    cycle: platformBillingInformation?.plan.stripeBillingCycle as BillingCycle,
    seats: platformBillingInformation?.plan.userSeatsLimit ?? DEFAULT_SEATS,
    activeFlows:
      platformBillingInformation?.plan.activeFlowsLimit ??
      DEFAULT_ACTIVE_FLOWS[
        platformBillingInformation?.plan.plan as StripePlanName
      ] ??
      10,
    projects:
      platformBillingInformation?.plan.projectsLimit ?? DEFAULT_PROJECTS,
    subscriptionStatus: platformBillingInformation?.plan
      .stripeSubscriptionStatus as ApSubscriptionStatus,
    isTrial,
  };
};

export const calculatePrice = (
  selectedPlan: string,
  selectedCycle: BillingCycle,
  selectedSeats: number[],
  selectedActiveFlows: number[],
  selectedProjects: number[],
  plans: (typeof planData.plans)[0][],
): PricingCalculation => {
  if (selectedPlan === PlanName.FREE) {
    return {
      basePlanPrice: 0,
      totalAddonCost: 0,
      addonCosts: { seats: 0, flows: 0, projects: 0 },
      totalPrice: 0,
      annualSavings: 0,
    };
  }

  const plan = plans.find((p) => p.name === selectedPlan);
  if (!plan) {
    return {
      basePlanPrice: 0,
      totalAddonCost: 0,
      addonCosts: { seats: 0, flows: 0, projects: 0 },
      totalPrice: 0,
      annualSavings: 0,
    };
  }

  const basePlanPrice = plan.price[selectedCycle];

  const extraSeats = Math.max(0, selectedSeats[0] - DEFAULT_SEATS);
  const extraFlows = Math.max(
    0,
    selectedActiveFlows[0] -
      (DEFAULT_ACTIVE_FLOWS[
        selectedPlan as PlanName.PLUS | PlanName.BUSINESS
      ] ?? 0),
  );
  const extraProjects = Math.max(0, selectedProjects[0] - DEFAULT_PROJECTS);

  const addonCosts = {
    seats: extraSeats * ADDON_PRICES.USER_SEAT[selectedCycle],
    flows: (extraFlows / 5) * ADDON_PRICES.ACTIVE_FLOWS[selectedCycle],
    projects: extraProjects * ADDON_PRICES.PROJECT[selectedCycle],
  };

  const totalAddonCost =
    addonCosts.seats + addonCosts.flows + addonCosts.projects;

  const monthlyPrice = basePlanPrice + totalAddonCost;
  const annualPrice = monthlyPrice * 12;

  const annualSavings =
    selectedCycle === BillingCycle.ANNUAL
      ? annualPrice / (1 - ANNUAL_DISCOUNT_PERCENTAGE) - annualPrice
      : annualPrice * ANNUAL_DISCOUNT_PERCENTAGE;

  return {
    basePlanPrice,
    addonCosts,
    totalAddonCost,
    totalPrice:
      selectedCycle === BillingCycle.MONTHLY ? monthlyPrice : annualPrice,
    annualSavings,
  };
};

export const getActionConfig = (
  dialogState: DialogState,
  currentPlanInfo: CurrentPlanInfo,
  canGoNext: boolean,
): ActionConfig => {
  const {
    selectedPlan,
    selectedSeats,
    selectedActiveFlows,
    selectedProjects,
    selectedCycle,
    currentStep,
  } = dialogState;
  const {
    plan: currentPlan,
    cycle: currentCycle,
    seats: currentSeats,
    activeFlows: currentActiveFlows,
    projects: currentProjects,
    isTrial,
  } = currentPlanInfo;

  const isFirstStep = currentStep === 1;
  const isSecondStep = currentStep === 2;
  const selectedPlanEnum = selectedPlan as PlanName;
  const isSamePlan = currentPlan === selectedPlanEnum;
  const isDowngradingToFree =
    selectedPlanEnum === PlanName.FREE &&
    currentPlan !== PlanName.FREE &&
    !isTrial;

  const isCycleChanged = currentCycle !== selectedCycle;
  const areAddonsChanged =
    currentSeats !== selectedSeats[0] ||
    currentActiveFlows !== selectedActiveFlows[0] ||
    currentProjects !== selectedProjects[0];
  const hasChanges = !isSamePlan || isCycleChanged || areAddonsChanged;

  if (isFirstStep) {
    if (selectedPlanEnum === PlanName.FREE) {
      return {
        type: ActionType.UPDATE_SUBSCRIPTION,
        label: isDowngradingToFree
          ? t('Downgrade to Free')
          : t("You're already Free"),
        disabled: !canGoNext || !isDowngradingToFree,
      };
    }

    return {
      type: ActionType.CONFIGURE_ADDONS,
      label: t('Configure Add-ons'),
      disabled: !canGoNext,
      icon: <ChevronRight className="h-4 w-4 ml-2" />,
    };
  }

  if (isSecondStep) {
    if (isTrial || currentPlan === PlanName.FREE) {
      return {
        type: ActionType.CREATE_SUBSCRIPTION,
        label: t('Start Subscription'),
        disabled: !canGoNext,
      };
    }

    return {
      type: ActionType.UPDATE_SUBSCRIPTION,
      label: t('Update Subscription'),
      disabled: !canGoNext || !hasChanges,
    };
  }

  return {
    type: ActionType.DISABLED,
    label: t('Continue'),
    disabled: true,
  };
};
