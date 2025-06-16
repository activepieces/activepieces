import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { todosHooks } from '@/features/todos/lib/todo-hook';
import {
  Action,
  ActionType,
  Step,
  TodoType,
  PopulatedTodo,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { useBuilderStateContext } from '../builder-hooks';

import { AgentTestingDialog } from './custom-test-step/test-agent-dialog';
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

type ActionWithoutNext = Omit<Action, 'nextAction'>;
enum DialogType {
  NONE = 'NONE',
  TODO_CREATE_TASK = 'TODO_CREATE_TASK',
  AGENT = 'AGENT',
  WEBHOOK = 'WEBHOOK',
}

const isTodoCreateTask = (step: Action) => {
  return (
    step.type === ActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-todos' &&
    step.settings.actionName === 'createTodoAndWait'
  );
};

const isRunAgent = (step: Action) => {
  return (
    step.type === ActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-agent' &&
    step.settings.actionName === 'run_agent'
  );
};

const isReturnResponseAndWaitForWebhook = (step: Action) => {
  return (
    step.type === ActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-webhook' &&
    step.settings.actionName === 'return_response_and_wait_for_next_webhook'
  );
};

const TestStepSectionImplementation = React.memo(
  ({
    isSaving,
    flowVersionId,
    currentStep,
  }: TestActionComponentProps & { currentStep: Action }) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const [activeDialog, setActiveDialog] = useState<DialogType>(
      DialogType.NONE,
    );
    const socket = useSocket();
    const [todoId, setTodoId] = useState<string | null>(null);
    const { sampleData, sampleDataInput } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[currentStep.name],
        sampleDataInput: state.sampleDataInput[currentStep.name],
      };
    });
    const form = useFormContext<ActionWithoutNext>();
    const { mutate: testAction, isPending: isWatingTestResult } =
      testStepHooks.useTestAction({
        currentStep,
        setErrorMessage,
        setConsoleLogs,
        onSuccess: () => {
          form.setValue(
            `settings.inputUiInfo.lastTestDate`,
            dayjs().toISOString(),
          );
        },
      });

    const { data: todo, isLoading: isLoadingTodo } = todosHooks.useTodo(todoId);

    const lastTestDate = currentStep.settings.inputUiInfo?.lastTestDate;

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
      const testStepResponse = await flowRunsApi.testStep(socket, {
        flowVersionId,
        stepName: currentStep.name,
      });
      const output = testStepResponse.output as { todoId: string };
      if (testStepResponse.success && !isNil(output)) {
        setTodoId(output.todoId as string);
      }
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
    };
    const isTesting =
      activeDialog !== DialogType.NONE || isLoadingTodo || isWatingTestResult;

    return (
      <>
        {!sampleDataExists && (
          <div className="flex-grow flex justify-center items-center w-full h-full">
            <TestButtonTooltip disabled={!currentStep.valid}>
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
                disabled={!currentStep.valid}
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
            isTesting={isTesting}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            consoleLogs={
              currentStep.type === ActionType.CODE ? consoleLogs : null
            }
            isSaving={isSaving}
            onRetest={onTestButtonClick}
          ></TestSampleDataViewer>
        )}
        {activeDialog === DialogType.TODO_CREATE_TASK &&
          currentStep.type === ActionType.PIECE &&
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
          currentStep.type === ActionType.PIECE &&
          todoId && (
            <AgentTestingDialog
              open={true}
              onOpenChange={(open) => !open && handleCloseDialog()}
              todoId={todoId}
              currentStep={currentStep}
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

const isAction = (step: Step): step is Action => {
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
