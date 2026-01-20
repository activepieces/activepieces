import { t } from 'i18next';
import React, { useContext, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { todosApi } from '@/features/todos/lib/todos-api';
import {
  FlowAction,
  FlowActionType,
  Step,
  TodoType,
  flowStructureUtil,
  isNil,
  StepRunResponse,
  PopulatedTodo,
  AgentResult,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { defaultAgentOutput, isRunAgent } from './agent-test-step';
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
  TODO_CREATE_TASK = 'TODO_CREATE_TASK',
  WEBHOOK = 'WEBHOOK',
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
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const [activeDialog, setActiveDialog] = useState<DialogType>(
      DialogType.NONE,
    );
    const { sampleData, sampleDataInput } = useBuilderStateContext((state) => {
      return {
        sampleData: state.outputSampleData[currentStep.name],
        sampleDataInput: state.inputSampleData[currentStep.name],
      };
    });
    const abortControllerRef = useRef<AbortController>(new AbortController());
    const [mutationKey, setMutationKey] = useState<string[]>([]);
    const [liveAgentResult, setLiveAgentResult] = useState<
      AgentResult | undefined
    >(undefined);
    const { mutate: testAction, isPending: isWatingTestResult } =
      testStepHooks.useTestAction({
        mutationKey,
        currentStep,
        setErrorMessage,
        setConsoleLogs,
        onSuccess: () => {
          setTodo(null);
        },
      });

    const [todo, setTodo] = useState<PopulatedTodo | null>(null);
    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;
    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const handleTodoTest = async () => {
      setActiveDialog(DialogType.TODO_CREATE_TASK);
      testAction({
        type: 'todoAction',
        onProgress: async (progress: StepRunResponse) => {
          if (progress.success) {
            const todoId = getTodoIdFromStepRunResponse(progress);
            if (todoId) {
              const todo = await todosApi.get(todoId);
              setTodo(todo);
            } else {
              setErrorMessage(
                `${t(`Can't find todo ID in the response`)} ${JSON.stringify(
                  progress.output,
                )}`,
              );
            }
          }
        },
      });
    };
    const handleAgentTest = async () => {
      testAction({
        type: 'agentAction',
        onProgress: async (progress: StepRunResponse) => {
          const outputProgress = progress.output;
          if (!isNil(outputProgress)) {
            setLiveAgentResult(outputProgress as AgentResult);
          }
        },
        onFinish: () => {
          setLiveAgentResult(undefined);
        },
      });
    };

    const onTestButtonClick = async () => {
      if (isTodoCreateTask(currentStep)) {
        handleTodoTest();
      } else if (isRunAgent(currentStep)) {
        setLiveAgentResult(defaultAgentOutput);
        handleAgentTest();
      } else if (isReturnResponseAndWaitForWebhook(currentStep)) {
        setActiveDialog(DialogType.WEBHOOK);
      } else {
        testAction(undefined);
      }
    };

    const handleCloseDialog = () => {
      setActiveDialog(DialogType.NONE);
      setTodo(null);
      abortControllerRef.current.abort();
      setMutationKey([Date.now().toString()]);
    };

    const isTesting = activeDialog !== DialogType.NONE || isWatingTestResult;
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
            agentResult={liveAgentResult}
            isTesting={isTesting || isLoadingDynamicProperties}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            consoleLogs={
              currentStep.type === FlowActionType.CODE ? consoleLogs : null
            }
            isSaving={isSaving}
            onRetest={onTestButtonClick}
          ></TestSampleDataViewer>
        )}
        {activeDialog === DialogType.TODO_CREATE_TASK &&
          currentStep.type === FlowActionType.PIECE &&
          todo && (
            <TodoTestingDialog
              open={true}
              key={todo.id}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseDialog();
                }
              }}
              todo={todo}
              currentStep={currentStep}
              setErrorMessage={setErrorMessage}
              type={
                currentStep.settings.actionName === 'createTodoAndWait'
                  ? TodoType.INTERNAL
                  : TodoType.EXTERNAL
              }
            />
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
const getTodoIdFromStepRunResponse = (stepRunResponse: StepRunResponse) => {
  if (
    stepRunResponse.output &&
    typeof stepRunResponse.output === 'object' &&
    'id' in stepRunResponse.output &&
    typeof stepRunResponse.output.id === 'string'
  ) {
    return stepRunResponse.output.id;
  }
  return null;
};
