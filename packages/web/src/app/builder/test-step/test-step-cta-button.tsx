import {
  FlowAction,
  FlowActionType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, Play } from 'lucide-react';
import { useContext } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TestButtonTooltip } from './test-step-tooltip';
import { testStepHooks } from './utils/test-step-hooks';

const PRIMARY_CTA_CLASSES =
  'w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 [&_span]:text-primary-foreground/70';

const TestStepCTAButton = () => {
  const [
    selectedStep,
    flowVersion,
    isStepBeingTested,
    setTestPanelOpen,
    run,
    saving,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.isStepBeingTested,
    state.setTestPanelOpen,
    state.run,
    state.saving,
  ]);

  const currentStep = selectedStep
    ? flowStructureUtil.getStep(selectedStep, flowVersion.trigger)
    : null;

  if (!currentStep) {
    return null;
  }

  const hasRun = !isNil(run);
  const lastTestDate = currentStep.settings?.sampleData?.lastTestDate;
  const sampleDataExists = !isNil(lastTestDate);
  const stepIsRunning = isStepBeingTested(currentStep.name);
  const openPanel = () => setTestPanelOpen(true);

  if (currentStep.type === FlowActionType.PIECE) {
    return (
      <PieceActionCTAButton
        currentStep={currentStep}
        sampleDataExists={sampleDataExists}
        stepIsRunning={stepIsRunning}
        onOpenPanel={openPanel}
        saving={saving}
        hasRun={hasRun}
      />
    );
  }

  if (hasRun) {
    return (
      <CTAShell>
        <TestButtonTooltip saving={saving} invalid={false}>
          <Button
            onClick={openPanel}
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
    return (
      <CTAShell>
        <Button
          variant="outline"
          onClick={openPanel}
          disabled={saving}
          className="w-full justify-center"
          size="sm"
        >
          <Eye className="size-4" />
          {t('Show Sample Data')}
        </Button>
        <TestButtonTooltip saving={saving} invalid={false}>
          <Button
            onClick={openPanel}
            disabled={saving}
            keyboardShortcut="G"
            onKeyboardShortcut={openPanel}
            className={PRIMARY_CTA_CLASSES}
            size="sm"
          >
            <Play className="size-4 fill-current" />
            {t('Retest Step')}
          </Button>
        </TestButtonTooltip>
      </CTAShell>
    );
  }

  return (
    <CTAShell>
      <TestButtonTooltip saving={saving} invalid={false}>
        <Button
          onClick={openPanel}
          disabled={saving}
          keyboardShortcut="G"
          onKeyboardShortcut={openPanel}
          className={PRIMARY_CTA_CLASSES}
          size="sm"
        >
          <Play className="size-4 fill-current" />
          {t('Test Step')}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

type PieceFlowAction = Extract<FlowAction, { type: FlowActionType.PIECE }>;

type PieceActionCTAButtonProps = {
  currentStep: PieceFlowAction;
  sampleDataExists: boolean;
  stepIsRunning: boolean;
  onOpenPanel: () => void;
  saving: boolean;
  hasRun: boolean;
};

const PieceActionCTAButton = ({
  currentStep,
  sampleDataExists,
  stepIsRunning,
  onOpenPanel,
  saving,
  hasRun,
}: PieceActionCTAButtonProps) => {
  const isReturnResponseAndWaitWebhook =
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
            onClick={fireTest}
            disabled={retestDisabled}
            keyboardShortcut="G"
            onKeyboardShortcut={fireTest}
            className={PRIMARY_CTA_CLASSES}
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
          onClick={fireTest}
          disabled={testDisabled}
          keyboardShortcut="G"
          onKeyboardShortcut={fireTest}
          className={PRIMARY_CTA_CLASSES}
          size="sm"
        >
          <Play className="size-4 fill-current" />
          {t('Test Step')}
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
