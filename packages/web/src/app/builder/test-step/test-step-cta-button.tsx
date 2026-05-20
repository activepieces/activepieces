import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, Play } from 'lucide-react';
import { useContext } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { pieceSelectorUtils } from '@/features/pieces';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TestButtonTooltip } from './test-step-tooltip';
import { testStepHooks } from './utils/test-step-hooks';

const PRIMARY_CTA_CLASSES =
  'w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 [&_span]:text-primary-foreground/70';

const SOFT_PRIMARY_CTA_CLASSES =
  'w-full justify-center bg-primary/5 hover:bg-primary/10 text-primary border-primary/20';

const TestStepCTAButton = () => {
  const [
    selectedStep,
    flowVersion,
    isStepBeingTested,
    setTestPanelOpen,
    requestStepAutoTest,
    run,
    saving,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.isStepBeingTested,
    state.setTestPanelOpen,
    state.requestStepAutoTest,
    state.run,
    state.saving,
  ]);

  const currentStep = selectedStep
    ? flowStructureUtil.getStep(selectedStep, flowVersion.trigger)
    : null;

  if (!currentStep) {
    return null;
  }

  const sampleDataExists = !isNil(
    currentStep.settings?.sampleData?.lastTestDate,
  );
  const stepIsRunning = isStepBeingTested(currentStep.name);
  const onOpenPanel = () => setTestPanelOpen(true);
  const onFireTest = () => requestStepAutoTest(currentStep.name);

  if (isFlowAction(currentStep)) {
    return (
      <ActionCTAButton
        currentStep={currentStep}
        sampleDataExists={sampleDataExists}
        stepIsRunning={stepIsRunning}
        onOpenPanel={onOpenPanel}
        saving={saving}
        hasRun={!isNil(run)}
      />
    );
  }

  if (isPieceTrigger(currentStep)) {
    if (
      pieceSelectorUtils.isManualTrigger({
        pieceName: currentStep.settings.pieceName,
        triggerName: currentStep.settings.triggerName ?? '',
      })
    ) {
      return null;
    }
    return (
      <TriggerCTAButton
        sampleDataExists={sampleDataExists}
        stepIsRunning={stepIsRunning}
        stepIsValid={currentStep.valid !== false}
        onOpenPanel={onOpenPanel}
        onFireTest={onFireTest}
        saving={saving}
        hasRun={!isNil(run)}
      />
    );
  }

  return null;
};

const isFlowAction = (step: Step): step is FlowAction =>
  flowStructureUtil.isAction(step.type);

const isPieceTrigger = (
  step: Step,
): step is Extract<FlowTrigger, { type: FlowTriggerType.PIECE }> =>
  step.type === FlowTriggerType.PIECE;

type ActionCTAButtonProps = {
  currentStep: FlowAction;
  sampleDataExists: boolean;
  stepIsRunning: boolean;
  onOpenPanel: () => void;
  saving: boolean;
  hasRun: boolean;
};

const ActionCTAButton = ({
  currentStep,
  sampleDataExists,
  stepIsRunning,
  onOpenPanel,
  saving,
  hasRun,
}: ActionCTAButtonProps) => {
  const isReturnResponseAndWaitWebhook =
    currentStep.type === FlowActionType.PIECE &&
    currentStep.settings.pieceName === '@activepieces/piece-webhook' &&
    currentStep.settings.actionName ===
      'return_response_and_wait_for_next_webhook';
  const stepIsValid = currentStep.valid !== false;
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const { mutate: testAction, isPending: isWaitingTestResult } =
    testStepHooks.useTestAction({ currentStep });

  const isTesting = stepIsRunning || isWaitingTestResult;
  const canFireTest =
    !isReturnResponseAndWaitWebhook &&
    !isTesting &&
    stepIsValid &&
    !isLoadingDynamicProperties;

  const fireTest = () => {
    onOpenPanel();
    if (canFireTest) {
      testAction(undefined);
    }
  };

  if (hasRun) {
    return (
      <CTAShell>
        <TestButtonTooltip saving={saving} invalid={false}>
          <Button
            onClick={onOpenPanel}
            disabled={saving}
            className={PRIMARY_CTA_CLASSES}
            size="sm"
          >
            <Eye className="size-4" />
            {t('Show Sample Data')}
          </Button>
        </TestButtonTooltip>
      </CTAShell>
    );
  }

  if (sampleDataExists) {
    const retestDisabled = saving || !stepIsValid || isLoadingDynamicProperties;
    return (
      <CTAShell>
        <Button
          variant="outline"
          onClick={onOpenPanel}
          disabled={saving}
          className="w-full justify-center"
          size="sm"
        >
          <Eye className="size-4" />
          {t('Show Sample Data')}
        </Button>
        <TestButtonTooltip saving={saving} invalid={!stepIsValid}>
          <Button
            variant="outline"
            onClick={fireTest}
            disabled={retestDisabled}
            keyboardShortcut="G"
            onKeyboardShortcut={fireTest}
            className={SOFT_PRIMARY_CTA_CLASSES}
            size="sm"
          >
            <Play className="size-4 fill-current" />
            {t('Retest Step')}
          </Button>
        </TestButtonTooltip>
      </CTAShell>
    );
  }

  const testDisabled = !stepIsValid || saving || isLoadingDynamicProperties;
  return (
    <CTAShell>
      <TestButtonTooltip saving={saving} invalid={!stepIsValid}>
        <Button
          variant="outline"
          onClick={fireTest}
          disabled={testDisabled}
          keyboardShortcut="G"
          onKeyboardShortcut={fireTest}
          className={SOFT_PRIMARY_CTA_CLASSES}
          size="sm"
        >
          <Play className="size-4 fill-current" />
          {t('Test Step')}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

type TriggerCTAButtonProps = {
  sampleDataExists: boolean;
  stepIsRunning: boolean;
  stepIsValid: boolean;
  onOpenPanel: () => void;
  onFireTest: () => void;
  saving: boolean;
  hasRun: boolean;
};

const TriggerCTAButton = ({
  sampleDataExists,
  stepIsRunning,
  stepIsValid,
  onOpenPanel,
  onFireTest,
  saving,
  hasRun,
}: TriggerCTAButtonProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const testDisabled =
    !stepIsValid || saving || isLoadingDynamicProperties || stepIsRunning;

  if (hasRun) {
    return (
      <CTAShell>
        <Button
          onClick={onOpenPanel}
          disabled={saving}
          className={PRIMARY_CTA_CLASSES}
          size="sm"
        >
          <Eye className="size-4" />
          {t('Show Sample Data')}
        </Button>
      </CTAShell>
    );
  }

  if (sampleDataExists) {
    return (
      <CTAShell>
        <Button
          variant="outline"
          onClick={onOpenPanel}
          disabled={saving}
          className="w-full justify-center"
          size="sm"
        >
          <Eye className="size-4" />
          {t('Show Sample Data')}
        </Button>
        <TestButtonTooltip saving={saving} invalid={!stepIsValid}>
          <Button
            variant="outline"
            onClick={onFireTest}
            disabled={testDisabled}
            keyboardShortcut="G"
            onKeyboardShortcut={onFireTest}
            className={SOFT_PRIMARY_CTA_CLASSES}
            size="sm"
          >
            <Play className="size-4 fill-current" />
            {t('Retest Trigger')}
          </Button>
        </TestButtonTooltip>
      </CTAShell>
    );
  }

  return (
    <CTAShell>
      <TestButtonTooltip saving={saving} invalid={!stepIsValid}>
        <Button
          variant="outline"
          onClick={onFireTest}
          disabled={testDisabled}
          keyboardShortcut="G"
          onKeyboardShortcut={onFireTest}
          className={SOFT_PRIMARY_CTA_CLASSES}
          size="sm"
        >
          <Play className="size-4 fill-current" />
          {t('Test Trigger')}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

const CTAShell = ({ children }: { children: React.ReactNode }) => (
  <div
    data-test-panel-trigger
    className="relative px-3 py-3 bg-background z-10 flex flex-col gap-2 shrink-0"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent"
    />
    {children}
  </div>
);

TestStepCTAButton.displayName = 'TestStepCTAButton';
export { TestStepCTAButton };
