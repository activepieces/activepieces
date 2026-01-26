import { t } from 'i18next';
import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import {
  FlowAction,
  FlowActionType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';
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
    const [ sampleData, sampleDataInput, errorMessage, consoleLogs]= useBuilderStateContext((state) => {
      return [state.outputSampleData[currentStep.name], state.inputSampleData[currentStep.name] , state.errorLogs[currentStep.name], state.consoleLogs[currentStep.name]];
    });

    const { mutate: testAction, isPending: isWatingTestResult } =
      testStepHooks.useTestAction({
        currentStep,
      });

    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;
    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

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

    const isTesting = activeDialog !== DialogType.NONE || isWatingTestResult || !isNil(currentStep.settings.sampleData?.testRunId);
    const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);

    return (
      <>
        {!sampleDataExists && (
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
        {sampleDataExists && (
          <TestSampleDataViewer
            isValid={currentStep.valid}
            currentStep={currentStep}
            isTesting={isTesting || isLoadingDynamicProperties}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            lastTestDate={lastTestDate}
            isSaving={isSaving}
            onRetest={onTestButtonClick}
            errorMessage={errorMessage}
            consoleLogs={consoleLogs}
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
