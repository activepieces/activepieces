import {
  FlowAction,
  FlowActionType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { FlaskConical, Play } from 'lucide-react';
import React, { useContext, useState } from 'react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { TestPanelHeader } from './test-panel-header';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepHooks } from './utils/test-step-hooks';
type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

enum DialogType {
  NONE = 'NONE',
  WEBHOOK = 'WEBHOOK',
}

const isReturnResponseAndWaitForWebhook = (step: FlowAction) => {
  return (
    step.type === FlowActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-webhook' &&
    step.settings.actionName === 'return_response_and_wait_for_next_webhook'
  );
};

const TestStepSectionImplementation = React.memo(
  ({
    isSaving,
    currentStep,
  }: TestActionComponentProps & { currentStep: FlowAction }) => {
    const [activeDialog, setActiveDialog] = useState<DialogType>(
      DialogType.NONE,
    );
    const [
      sampleData,
      sampleDataInput,
      errorMessage,
      consoleLogs,
      isStepBeingTested,
      removeStepTestListener,
      revertSampleDataLocally,
    ] = useBuilderStateContext((state) => {
      return [
        state.outputSampleData[currentStep.name],
        state.inputSampleData[currentStep.name],
        state.errorLogs[currentStep.name],
        currentStep.type === FlowActionType.CODE
          ? state.consoleLogs[currentStep.name]
          : null,
        state.isStepBeingTested,
        state.removeStepTestListener,
        state.revertSampleDataLocallyCallbacks[currentStep.name],
      ];
    });

    const { mutate: testAction, isPending: isWatingTestResult } =
      testStepHooks.useTestAction({
        currentStep,
      });

    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;

    const sampleDataExists =
      !isNil(lastTestDate) ||
      !isNil(errorMessage) ||
      isStepBeingTested(currentStep.name);
    const onTestButtonClick = async () => {
      if (isReturnResponseAndWaitForWebhook(currentStep)) {
        setActiveDialog(DialogType.WEBHOOK);
      } else {
        testAction(undefined);
      }
    };

    const handleCloseDialog = () => {
      setActiveDialog(DialogType.NONE);
    };

    const isTesting =
      activeDialog !== DialogType.NONE ||
      isWatingTestResult ||
      isStepBeingTested(currentStep.name);
    const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);

    return (
      <>
        {!sampleDataExists && !isTesting && (
          <div className="flex flex-col h-full">
            <TestPanelHeader status="idle" hideRetest />
            <div className="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
                <FlaskConical className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <span className="text-sm font-medium text-foreground">
                  {t('No sample data yet')}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Run this step to capture sample data. You can then use the result in following steps.',
                  )}
                </span>
              </div>
              <TestButtonTooltip saving={isSaving} invalid={!currentStep.valid}>
                <Button
                  size="sm"
                  onClick={onTestButtonClick}
                  loading={isTesting || isSaving}
                  disabled={!currentStep.valid || isLoadingDynamicProperties}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="size-3.5 fill-current" />
                  {t('Test Step')}
                </Button>
              </TestButtonTooltip>
            </div>
          </div>
        )}
        {(sampleDataExists || isTesting) && (
          <TestSampleDataViewer
            isValid={currentStep.valid && !isLoadingDynamicProperties}
            currentStep={currentStep}
            isTesting={isTesting}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            lastTestDate={lastTestDate}
            isSaving={isSaving}
            onRetest={onTestButtonClick}
            errorMessage={errorMessage}
            consoleLogs={consoleLogs}
            onCancelTesting={() => {
              removeStepTestListener(currentStep.name);
              revertSampleDataLocally?.();
            }}
          ></TestSampleDataViewer>
        )}
        {activeDialog === DialogType.WEBHOOK && (
          <TestWebhookDialog
            testingMode="returnResponseAndWaitForNextWebhook"
            open={true}
            onOpenChange={(open) => !open && handleCloseDialog()}
            currentStep={currentStep}
          />
        )}
      </>
    );
  },
);

const isAction = (step: Step): step is FlowAction => {
  return flowStructureUtil.isAction(step.type);
};
const TestActionSection = React.memo((props: TestActionComponentProps) => {
  const currentStep = useBuilderStateContext((state) =>
    state.selectedStep
      ? flowStructureUtil.getStep(state.selectedStep, state.flowVersion.trigger)
      : null,
  );
  if (isNil(currentStep) || !isAction(currentStep)) {
    return null;
  }

  return <TestStepSectionImplementation {...props} currentStep={currentStep} />;
});

TestStepSectionImplementation.displayName = 'TestStepSectionImplementation';
TestActionSection.displayName = 'TestActionSection';

export { TestActionSection };
