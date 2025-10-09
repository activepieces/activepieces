import { t } from 'i18next';
import { Sparkle, ChevronRight } from 'lucide-react';
import { FC, useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';
import {
  ApSubscriptionStatus,
  BillingCycle,
  PlanName,
  StripePlanName,
} from '@activepieces/ee-shared';
import {
  ApEdition,
  ApFlagId,
  isNil,
  PlatformUsageMetric,
} from '@activepieces/shared';

import { billingMutations, billingQueries } from '../../lib/billing-hooks';

import { AddonsStep } from './addons-step';
import {
  planData,
  DEFAULT_PROJECTS,
  DEFAULT_SEATS,
  DEFAULT_ACTIVE_FLOWS,
} from './data';
import { PlanSelectionStep } from './plan-selection-step';
import { useManagePlanDialogStore } from './store';
import { SubscriptionSummary } from './summary';
import { calculatePrice, getActionConfig, getCurrentPlanInfo } from './utils';

export enum ActionType {
  CONFIGURE_ADDONS = 'configure-addons',
  UPDATE_SUBSCRIPTION = 'update-subscription',
  CREATE_SUBSCRIPTION = 'create-subscription',
  DISABLED = 'disabled',
}

export interface DialogState {
  selectedPlan: string;
  selectedCycle: BillingCycle;
  selectedSeats: number[];
  selectedActiveFlows: number[];
  selectedProjects: number[];
  currentStep: number;
}

export interface CurrentPlanInfo {
  plan: PlanName;
  cycle: BillingCycle;
  seats: number;
  activeFlows: number;
  projects: number;
  subscriptionStatus: ApSubscriptionStatus;
  isTrial: boolean;
}

export interface PricingCalculation {
  basePlanPrice: number;
  totalAddonCost: number;
  addonCosts: {
    seats: number;
    flows: number;
    projects: number;
  };
  totalPrice: number;
  annualSavings: number;
}

export interface ActionConfig {
  type: ActionType;
  label: string;
  disabled: boolean;
  icon?: React.ReactNode;
}

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

export const UpgradeDialog: FC = () => {
  const { dialog, closeDialog } = useManagePlanDialogStore();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformBillingInformation } =
    billingQueries.usePlatformSubscription(platform.id);

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isEnterprise =
    !isNil(platformBillingInformation?.plan.licenseKey) ||
    platformBillingInformation?.plan.plan === PlanName.ENTERPRISE ||
    edition === ApEdition.ENTERPRISE;

  const currentPlanInfo = useMemo(
    () => getCurrentPlanInfo(platformBillingInformation),
    [platformBillingInformation],
  );

  const [dialogState, setDialogState] = useState<DialogState>({
    selectedPlan: currentPlanInfo.plan,
    selectedCycle: currentPlanInfo.cycle,
    selectedSeats: [0],
    selectedActiveFlows: [0],
    selectedProjects: [0],
    currentStep: 1,
  });

  useEffect(() => {
    const samePlan = currentPlanInfo.plan === dialogState.selectedPlan;
    setDialogState({
      selectedPlan: currentPlanInfo.plan,
      selectedCycle: currentPlanInfo.cycle,
      selectedSeats: [samePlan ? currentPlanInfo.seats : DEFAULT_SEATS],
      selectedActiveFlows: [
        samePlan
          ? currentPlanInfo.activeFlows
          : DEFAULT_ACTIVE_FLOWS[PlanName.PLUS],
      ],
      selectedProjects: [
        samePlan ? currentPlanInfo.projects : DEFAULT_PROJECTS,
      ],
      currentStep: !isNil(dialog.step) ? dialog.step : 1,
    });
  }, [dialog.isOpen, dialog.step, currentPlanInfo]);

  const pricing = useMemo(
    () =>
      calculatePrice(
        dialogState.selectedPlan,
        dialogState.selectedCycle,
        dialogState.selectedSeats,
        dialogState.selectedActiveFlows,
        dialogState.selectedProjects,
        planData.plans,
      ),
    [dialogState],
  );

  const canGoNext =
    dialogState.currentStep === 1 ? dialogState.selectedPlan !== '' : true;

  const actionConfig = useMemo(
    () => getActionConfig(dialogState, currentPlanInfo, canGoNext),
    [dialogState, currentPlanInfo, canGoNext],
  );

  const { mutate: updateSubscription, isPending: isUpdatingSubscription } =
    billingMutations.useUpdateSubscription(() => closeDialog());
  const { mutate: createSubscription, isPending: isCreatingSubscription } =
    billingMutations.useCreateSubscription(() => closeDialog());

  const isLoading = isUpdatingSubscription || isCreatingSubscription;

  const updateDialogState = (updates: Partial<DialogState>) => {
    setDialogState((prev) => ({ ...prev, ...updates }));
  };

  const handlePlanSelect = (plan: string) => {
    updateDialogState({
      selectedActiveFlows: [0],
      selectedProjects: [0],
      selectedSeats: [0],
    });

    updateDialogState({ selectedPlan: plan });
  };

  const handleCycleChange = (cycle: BillingCycle) => {
    updateDialogState({ selectedCycle: cycle });
  };

  const handleStepChange = (step: number) => {
    updateDialogState({ currentStep: step });
  };

  const handleSeatsChange = (seats: number[]) => {
    updateDialogState({ selectedSeats: seats });
  };

  const handleActiveFlowsChange = (flows: number[]) => {
    updateDialogState({ selectedActiveFlows: flows });
  };

  const handleProjectsChange = (projects: number[]) => {
    updateDialogState({ selectedProjects: projects });
  };

  const handleActionClick = () => {
    const selectedPlanEnum = dialogState.selectedPlan as PlanName;

    switch (actionConfig.type) {
      case ActionType.CONFIGURE_ADDONS:
        handleStepChange(2);
        break;

      case ActionType.UPDATE_SUBSCRIPTION:
        updateSubscription({
          plan: selectedPlanEnum as StripePlanName,
          cycle: dialogState.selectedCycle,
          addons: {
            userSeats: dialogState.selectedSeats[0],
            activeFlows: dialogState.selectedActiveFlows[0],
            projects: dialogState.selectedProjects[0],
          },
        });
        break;

      case ActionType.CREATE_SUBSCRIPTION:
        createSubscription({
          plan: selectedPlanEnum as StripePlanName,
          cycle: dialogState.selectedCycle,
          addons: {
            userSeats: dialogState.selectedSeats[0],
            activeFlows: dialogState.selectedActiveFlows[0],
            projects: dialogState.selectedProjects[0],
          },
        });
        break;

      case ActionType.DISABLED:
      default:
        break;
    }
  };

  if (isEnterprise || edition === ApEdition.COMMUNITY) return null;

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
  const title = dialog.title || t('Customize Your Plan');
  const steps = [{ title: t('Select Plan') }, { title: t('Add-ons') }];

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
          <div className="flex-1 flex flex-col">
            <div className="p-2 h-16 items-center flex justify-center border-b bg-muted/20">
              <Stepper currentStep={dialogState.currentStep} steps={steps} />
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {dialogState.currentStep === 1 ? (
                <PlanSelectionStep
                  selectedPlan={dialogState.selectedPlan}
                  currentPlan={currentPlanInfo.plan}
                  selectedCycle={dialogState.selectedCycle}
                  onPlanSelect={handlePlanSelect}
                />
              ) : (
                <AddonsStep
                  selectedPlan={dialogState.selectedPlan}
                  currentPlanInfo={currentPlanInfo}
                  selectedSeats={dialogState.selectedSeats}
                  onSeatsChange={handleSeatsChange}
                  selectedActiveFlows={dialogState.selectedActiveFlows}
                  onActiveFlowsChange={handleActiveFlowsChange}
                  selectedProjects={dialogState.selectedProjects}
                  onProjectsChange={handleProjectsChange}
                />
              )}
            </div>
          </div>

          <SubscriptionSummary
            dialogState={dialogState}
            currentPlanInfo={currentPlanInfo}
            pricing={pricing}
            actionConfig={actionConfig}
            isLoading={isLoading}
            onCycleChange={handleCycleChange}
            onStepChange={handleStepChange}
            onActionClick={handleActionClick}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
