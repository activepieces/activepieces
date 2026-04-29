import {
  FlowAction,
  FlowActionType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Play } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';

import { TestButtonTooltip } from './test-step-tooltip';
import { testStepHooks } from './utils/test-step-hooks';

type TestStepCTAVariant = 'sticky' | 'header';

type TestStepCTABaseProps = {
  variant?: TestStepCTAVariant;
};

const TestStepCTAButton = (props: TestStepCTABaseProps) => {
  return <TestStepCTAButtonInternal variant={props.variant ?? 'sticky'} />;
};

const TestStepHeaderCTAButton = () => {
  return <TestStepCTAButtonInternal variant="header" />;
};

const TestStepCTAButtonInternal = ({
  variant,
}: {
  variant: TestStepCTAVariant;
}) => {
  const [
    selectedStep,
    flowVersion,
    isStepBeingTested,
    setTestDrawerOpen,
    isTestDrawerOpen,
    run,
    saving,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.isStepBeingTested,
    state.setTestDrawerOpen,
    state.isTestDrawerOpen,
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

  if (currentStep.type === FlowActionType.PIECE) {
    return (
      <PieceActionCTAButton
        currentStep={currentStep}
        sampleDataExists={sampleDataExists}
        stepIsRunning={stepIsRunning}
        onOpenDrawer={() => setTestDrawerOpen(true)}
        drawerOpen={isTestDrawerOpen}
        saving={saving}
        hasRun={hasRun}
        variant={variant}
      />
    );
  }

  const openDrawer = () => setTestDrawerOpen(true);
  return (
    <CTAShell variant={variant}>
      <Button
        onClick={openDrawer}
        disabled={saving}
        keyboardShortcut="G"
        onKeyboardShortcut={openDrawer}
        variant={variant === 'sticky' ? 'outline' : 'ghost'}
        className={
          variant === 'sticky'
            ? 'w-full justify-center text-primary hover:text-primary'
            : 'bg-transparent text-primary hover:bg-primary/10 px-2'
        }
        size={variant === 'sticky' ? 'sm' : 'sm'}
      >
        <Play className="size-4 fill-current" />
        {hasRun ? t('View output') : t('Test Step')}
      </Button>
    </CTAShell>
  );
};

type PieceFlowAction = Extract<FlowAction, { type: FlowActionType.PIECE }>;

type PieceActionCTAButtonProps = {
  currentStep: PieceFlowAction;
  sampleDataExists: boolean;
  stepIsRunning: boolean;
  onOpenDrawer: () => void;
  drawerOpen: boolean;
  saving: boolean;
  hasRun: boolean;
  variant: TestStepCTAVariant;
};

const PieceActionCTAButton = ({
  currentStep,
  sampleDataExists,
  stepIsRunning,
  onOpenDrawer,
  drawerOpen,
  saving,
  hasRun,
  variant,
}: PieceActionCTAButtonProps) => {
  const isReturnResponseAndWaitWebhook =
    currentStep.settings.pieceName === '@activepieces/piece-webhook' &&
    currentStep.settings.actionName ===
      'return_response_and_wait_for_next_webhook';
  const stepIsValid = currentStep.valid !== false;
  const { mutate: testAction, isPending: isWaitingTestResult } =
    testStepHooks.useTestAction({ currentStep });

  const isTesting = stepIsRunning || isWaitingTestResult;
  const disabled = !stepIsValid || saving;
  const canAutoFireTest = !isReturnResponseAndWaitWebhook && !hasRun;

  const handleClick = () => {
    if (!drawerOpen) {
      onOpenDrawer();
    }
    if (canAutoFireTest && !isTesting && stepIsValid) {
      testAction(undefined);
    }
  };

  const label = isTesting
    ? t('Testing...')
    : hasRun
    ? t('View output')
    : sampleDataExists
    ? t('Re-test step')
    : t('Test Step');

  return (
    <CTAShell variant={variant}>
      <TestButtonTooltip saving={saving} invalid={!stepIsValid}>
        <Button
          onClick={handleClick}
          disabled={disabled}
          loading={isTesting}
          keyboardShortcut="G"
          onKeyboardShortcut={handleClick}
          variant={variant === 'sticky' ? 'outline' : 'ghost'}
          className={
            variant === 'sticky'
              ? 'w-full justify-center text-primary hover:text-primary disabled:opacity-60'
              : 'bg-transparent text-primary hover:bg-primary/10 px-2 disabled:opacity-60'
          }
          size="sm"
        >
          {!isTesting && <Play className="size-4 fill-current" />}
          {label}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

type CTAShellProps = {
  variant: TestStepCTAVariant;
  children: React.ReactNode;
};

const CTAShell = ({ variant, children }: CTAShellProps) => {
  if (variant === 'sticky') {
    return (
      <div className="sticky bottom-0 left-0 right-0 px-3 py-3 bg-background border-t border-border z-10">
        {children}
      </div>
    );
  }
  return <>{children}</>;
};

TestStepCTAButton.displayName = 'TestStepCTAButton';
TestStepHeaderCTAButton.displayName = 'TestStepHeaderCTAButton';
export { TestStepCTAButton, TestStepHeaderCTAButton };
