import { t } from 'i18next';
import React, { useContext, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import {
  FlowAction,
  FlowActionType,
  Step,
  TodoType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TodoTestingDialog } from './custom-test-step/test-todo-dialog';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
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
  TODO = 'TODO',
}

const isTodoCreateTask = (step: FlowAction) => {
  return (
    step.type === FlowActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-todos' &&
    step.settings.actionName === 'createTodoAndWait'
  );
};

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
    const handleTodoTest = async () => {
      setActiveDialog(DialogType.TODO);
      testAction(undefined);
    };
    const sampleDataExists =
      !isNil(lastTestDate) ||
      !isNil(errorMessage) ||
      isStepBeingTested(currentStep.name);
    const onTestButtonClick = async () => {
      if (isReturnResponseAndWaitForWebhook(currentStep)) {
        setActiveDialog(DialogType.WEBHOOK);
      } else if (isTodoCreateTask(currentStep)) {
        setActiveDialog(DialogType.TODO);
        handleTodoTest();
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
          <div className="grow flex justify-center items-center w-full h-full">
            <TestButtonTooltip invalid={!currentStep.valid}>
              <Button
                variant="outline"
                size="sm"
                onClick={onTestButtonClick}
                keyboardShortcut="G"
                onKeyboardShortcut={onTestButtonClick}
                loading={isTesting || isSaving}
                disabled={!currentStep.valid || isLoadingDynamicProperties}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Test Step')}
              </Button>
            </TestButtonTooltip>
          </div>
        )}
        {(sampleDataExists || isTesting) && (
          <TestSampleDataViewer
            isValid={currentStep.valid || isLoadingDynamicProperties}
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
        {activeDialog === DialogType.TODO &&
          currentStep.type === FlowActionType.PIECE &&
          sampleData &&
          typeof sampleData === 'object' &&
          'id' in sampleData && (
            <TodoTestingDialog
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseDialog();
                }
              }}
              id={sampleData.id as string}
              currentStep={currentStep}
              type={
                currentStep.settings.actionName === 'createTodoAndWait'
                  ? TodoType.INTERNAL
                  : TodoType.EXTERNAL
              }
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
