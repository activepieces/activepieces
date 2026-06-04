import {
  FlowAction,
  FlowTrigger,
  FlowTriggerType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Play } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { toast } from 'sonner';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { pieceSelectorUtils } from '@/features/pieces';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import {
  useActionTestRunner,
  useTriggerTestRunner,
} from './test-runner-context';
import { TestButtonTooltip } from './test-step-tooltip';

const SOFT_PRIMARY_CTA_CLASSES =
  'w-full justify-center bg-primary/5 enabled:hover:bg-primary/15 enabled:hover:text-primary text-primary border-primary/20';

const TestStepCTAButton = () => {
  const [
    selectedStep,
    flowVersion,
    isStepBeingTested,
    setStepDataPanelOpen,
    run,
    saving,
  ] = useBuilderStateContext((state) => [
    state.selectedStep,
    state.flowVersion,
    state.isStepBeingTested,
    state.setStepDataPanelOpen,
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
  const onOpenPanel = () => setStepDataPanelOpen(true);

  if (isFlowAction(currentStep)) {
    return (
      <ActionCTAButton
        currentStep={currentStep}
        sampleDataExists={sampleDataExists}
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
  onOpenPanel: () => void;
  saving: boolean;
  hasRun: boolean;
};

const ActionCTAButton = ({
  currentStep,
  sampleDataExists,
  onOpenPanel,
  saving,
  hasRun,
}: ActionCTAButtonProps) => {
  const stepIsValid = currentStep.valid !== false;
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const runner = useActionTestRunner();
  useConfigureStepShortcutToast(stepIsValid);

  const fireTest = () => {
    onOpenPanel();
    runner?.fireTest();
  };

  if (hasRun) {
    return (
      <CTAShell>
        <TestButtonTooltip saving={saving} invalid={false}>
          <Button
            variant="outline"
            onClick={onOpenPanel}
            disabled={saving}
            className={SOFT_PRIMARY_CTA_CLASSES}
            size="sm"
          >
            {t('Show Output')}
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
  saving: boolean;
  hasRun: boolean;
};

const TriggerCTAButton = ({
  sampleDataExists,
  stepIsRunning,
  stepIsValid,
  onOpenPanel,
  saving,
  hasRun,
}: TriggerCTAButtonProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  const runner = useTriggerTestRunner();
  useConfigureStepShortcutToast(stepIsValid);

  const fireTest = () => {
    onOpenPanel();
    runner?.fireTest();
  };

  const runnerBusy = runner?.isTesting ?? false;
  const runnerReady = runner?.canFireTest ?? false;
  const testDisabled =
    !stepIsValid ||
    saving ||
    isLoadingDynamicProperties ||
    stepIsRunning ||
    runnerBusy ||
    !runnerReady;

  if (hasRun) {
    return (
      <CTAShell>
        <Button
          variant="outline"
          onClick={onOpenPanel}
          disabled={saving}
          className={SOFT_PRIMARY_CTA_CLASSES}
          size="sm"
        >
          {t('Show Output')}
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
          {t('Show Sample Data')}
        </Button>
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
          onClick={fireTest}
          disabled={testDisabled}
          keyboardShortcut="G"
          onKeyboardShortcut={fireTest}
          className={SOFT_PRIMARY_CTA_CLASSES}
          size="sm"
          data-testid="test-trigger-button"
        >
          <Play className="size-4 fill-current" />
          {t('Test Trigger')}
        </Button>
      </TestButtonTooltip>
    </CTAShell>
  );
};

const useConfigureStepShortcutToast = (stepIsValid: boolean) => {
  useEffect(() => {
    if (stepIsValid) return;
    const isMac = /(Mac)/i.test(navigator.userAgent);
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlG =
        e.key.toLowerCase() === 'g' && (isMac ? e.metaKey : e.ctrlKey);
      if (!isCtrlG) return;
      toast.error(t('Configure step first'));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stepIsValid]);
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
