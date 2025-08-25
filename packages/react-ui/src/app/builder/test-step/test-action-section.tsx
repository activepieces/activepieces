import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useContext, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import {
  FlowAction,
  FlowActionType,
  Step,
  TodoType,
  PopulatedTodo,
  flowStructureUtil,
  isNil,
  StepRunResponse,
} from '@activepieces/shared';

import { AgentRunDialog } from '../../../features/agents/agent-run-dialog';
import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { useBuilderStateContext } from '../builder-hooks';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TodoTestingDialog } from './custom-test-step/test-todo-dialog';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { testStepHooks } from './test-step-hooks';
import { TestButtonTooltip } from './test-step-tooltip';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

type ActionWithoutNext = Omit<FlowAction, 'nextAction'>;
enum DialogType {
  NONE = 'NONE',
  TODO_CREATE_TASK = 'TODO_CREATE_TASK',
  AGENT = 'AGENT',
  WEBHOOK = 'WEBHOOK',
}

const isTodoCreateTask = (step: FlowAction) => {
  return (
    step.type === FlowActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-todos' &&
    step.settings.actionName === 'createTodoAndWait'
  );
};

const isRunAgent = (step: FlowAction) => {
  return (
    step.type === FlowActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-agent' &&
    step.settings.actionName === 'run_agent'
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
    flowVersionId,
    currentStep,
  }: TestActionComponentProps & { currentStep: FlowAction }) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const [activeDialog, setActiveDialog] = useState<DialogType>(
      DialogType.NONE,
    );
    const socket = useSocket();
    const [todoId, setTodoId] = useState<string | null>(null);
    const [agentProgress, setAgentProgress] = useState<StepRunResponse | null>(
      null,
    );
    const agentRunId = stepUtils.getAgentRunId(agentProgress);
    const { sampleData, sampleDataInput } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[currentStep.name],
        sampleDataInput: state.sampleDataInput[currentStep.name],
      };
    });
    const form = useFormContext<ActionWithoutNext>();
    const abortControllerRef = useRef<AbortController>(new AbortController());
    const [mutationKey, setMutationKey] = useState<string[]>([]);
    const { mutate: testAction, isPending: isWatingTestResult } =
      testStepHooks.useTestAction({
        mutationKey,
        currentStep,
        setErrorMessage,
        setConsoleLogs,
        onSuccess: () => {
          form.setValue(
            `settings.sampleData.lastTestDate`,
            dayjs().toISOString(),
          );
        },
        onProgress: (progress: any) => {
          if (isRunAgent(currentStep)) {
            setAgentProgress(progress);
          }
        },
      });

    const { data: todo, isLoading: isLoadingTodo } = todosHooks.useTodo(todoId);

    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;

    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const handleTodoCreateTask = async () => {
      setActiveDialog(DialogType.TODO_CREATE_TASK);
      const testStepResponse = await flowRunsApi.testStep(socket, {
        flowVersionId,
        stepName: currentStep.name,
      });
      const output = testStepResponse.output as PopulatedTodo;
      if (testStepResponse.success && !isNil(output)) {
        setTodoId(output.id as string);
      }
    };

    const handleRunAgent = async () => {
      setActiveDialog(DialogType.AGENT);
      setAgentProgress(null);
      abortControllerRef.current = new AbortController();
      testAction({
        abortSignal: abortControllerRef.current.signal,
      });
    };

    const onTestButtonClick = async () => {
      if (isRunAgent(currentStep)) {
        handleRunAgent();
      } else if (isTodoCreateTask(currentStep)) {
        handleTodoCreateTask();
      } else if (isReturnResponseAndWaitForWebhook(currentStep)) {
        setActiveDialog(DialogType.WEBHOOK);
      } else {
        testAction(undefined);
      }
    };

    const handleCloseDialog = () => {
      setActiveDialog(DialogType.NONE);
      setTodoId(null);
      setAgentProgress(null);
      abortControllerRef.current.abort();
      setMutationKey([Date.now().toString()]);
    };
    const isTesting =
      activeDialog !== DialogType.NONE || isLoadingTodo || isWatingTestResult;
    const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
    return (
      <>
        {!sampleDataExists && (
          <div className="flex-grow flex justify-center items-center w-full h-full">
            <TestButtonTooltip invalid={!currentStep.valid}>
              <Button
                variant="outline"
                size="sm"
                onClick={onTestButtonClick}
                keyboardShortcut="G"
                onKeyboardShortcut={() => {
                  if (isTodoCreateTask(currentStep)) {
                    handleTodoCreateTask();
                  } else if (isRunAgent(currentStep)) {
                    handleRunAgent();
                  } else {
                    testAction(undefined);
                  }
                }}
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
              onOpenChange={(open) => !open && handleCloseDialog()}
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
        {activeDialog === DialogType.AGENT &&
          currentStep.type === FlowActionType.PIECE && (
            <AgentRunDialog
              open={true}
              onOpenChange={(open) => !open && handleCloseDialog()}
              agentRunId={agentRunId}
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
