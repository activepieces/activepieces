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

  const showsViewState = sampleDataExists || hasRun;
  const label = showsViewState ? t('View sample data') : t('Test Step');
  const Icon = showsViewState ? Eye : Play;
  return (
    <CTAShell>
      <TestButtonTooltip saving={saving} invalid={false}>
        <Button
          onClick={openPanel}
          disabled={saving}
          keyboardShortcut="G"
          onKeyboardShortcut={openPanel}
          className="w-full justify-center bg-primary/70 text-primary-foreground enabled:hover:bg-primary disabled:opacity-50 [&_span]:text-primary-foreground/70"
          size="sm"
        >
          <Icon className={showsViewState ? 'size-4' : 'size-4 fill-current'} />
          {label}
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
  const showsViewState = sampleDataExists || hasRun;
  const disabled = showsViewState
    ? saving
    : !stepIsValid || saving || isLoadingDynamicProperties;
  const canAutoFireTest = !isReturnResponseAndWaitWebhook && !showsViewState;

  const handleClick = () => {
    onOpenPanel();
    if (
      canAutoFireTest &&
      !isTesting &&
      stepIsValid &&
      !isLoadingDynamicProperties
    ) {
      testAction(undefined);
    }
  };

  const label = isTesting
    ? t('Testing...')
    : showsViewState
    ? t('View sample data')
    : t('Test Step');
  const Icon = showsViewState ? Eye : Play;

  return (
    <CTAShell>
      <TestButtonTooltip
        saving={saving}
        invalid={!showsViewState && !stepIsValid}
      >
        <Button
          onClick={handleClick}
          disabled={disabled}
          loading={isTesting}
          keyboardShortcut="G"
          onKeyboardShortcut={handleClick}
          className="w-full justify-center bg-primary/70 text-primary-foreground enabled:hover:bg-primary disabled:opacity-50 [&_span]:text-primary-foreground/70"
          size="sm"
        >
          {!isTesting && (
            <Icon
              className={showsViewState ? 'size-4' : 'size-4 fill-current'}
            />
          )}
          {label}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

const CTAShell = ({ children }: { children: React.ReactNode }) => (
  <div className="sticky bottom-0 left-0 right-0 px-3 py-3 bg-background border-t border-border z-10">
    {children}
  </div>
);

TestStepCTAButton.displayName = 'TestStepCTAButton';
export { TestStepCTAButton };
