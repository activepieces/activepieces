import { t } from 'i18next';
import React, { useState } from 'react';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { todosApi } from '@/features/todos/lib/todos-api';
import {
  Action,
  ActionType,
  Step,
  TodoType,
  TodoWithAssignee,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { useBuilderStateContext } from '../builder-hooks';

import { TodoTestingDialog } from './custom-test-step/test-todo-dialog';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import testStepHooks from './test-step-hooks';
import { TestButtonTooltip } from './test-step-tooltip';
import { todosHooks } from '@/features/todos/lib/todo-hook';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

const isTodoCreateTask = (step: Action) => {
  return (
    step.type === ActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-todos' &&
    step.settings.actionName === 'createTodoAndWait'
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
    projectId,
    currentStep,
  }: TestActionComponentProps & { currentStep: Action }) => {
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const [isTodoCreateTaskDialogOpen, setIsTodoCreateTaskDialogOpen] = useState(false);
    const socket = useSocket();
    const [todoId, setTodoId] = useState<string | null>(null);

    const [
      isReturnResponseAndWaitForWebhookDialogOpen,
      setIsReturnResponseAndWaitForWebhookDialogOpen,
    ] = useState(false);
    const { sampleData, sampleDataInput } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[currentStep.name],
        sampleDataInput: state.sampleDataInput[currentStep.name],
      };
    });
    const { mutate, isPending: isTesting } = testStepHooks.useTestAction({
      currentStep,
      setErrorMessage,
      setConsoleLogs,
      onSuccess: undefined,
    });

    const { data: todo, isLoading: isLoadingTodo } =  todosHooks.useTodo(todoId)

    const lastTestDate = currentStep.settings.inputUiInfo?.lastTestDate;

    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const handleTodoCreateTask = async () => {
      setIsTodoCreateTaskDialogOpen(true);
      const testStepResponse = await flowRunsApi.testStep(socket, {
        flowVersionId,
        stepName: currentStep.name,
      });
      const output = testStepResponse.output as TodoWithAssignee;
      if (testStepResponse.success && !isNil(output)) {
        setTodoId(output.id as string);
      }
    };

    const onTestButtonClick = async () => {
      if (isTodoCreateTask(currentStep)) {
        handleTodoCreateTask();
      } else if (isReturnResponseAndWaitForWebhook(currentStep)) {
        setIsReturnResponseAndWaitForWebhookDialogOpen(true);
      } else {
        mutate(undefined);
      }
    };
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
                  } else {
                    mutate(undefined);
                  }
                }}
                loading={isTesting || isTodoCreateTaskDialogOpen || isLoadingTodo}
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
            isTesting={isTesting || isTodoCreateTaskDialogOpen || isLoadingTodo}
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
        {isTodoCreateTaskDialogOpen &&
          currentStep.type === ActionType.PIECE &&
          todo && (
            <TodoTestingDialog
              open={isTodoCreateTaskDialogOpen}
              onOpenChange={(open) => {
                setIsTodoCreateTaskDialogOpen(open);
                if (!open) {
                  setTodoId(null);
                }
              }}
              todo={todo}
              flowVersionId={flowVersionId}
              projectId={projectId}
              currentStep={currentStep}
              setErrorMessage={setErrorMessage}
              type={
                currentStep.settings.actionName === 'createTodoAndWait'
                  ? TodoType.INTERNAL
                  : TodoType.EXTERNAL
              }
            />
          )}
        {isReturnResponseAndWaitForWebhookDialogOpen && (
          <TestWebhookDialog
            testingMode="returnResponseAndWaitForNextWebhook"
            open={isReturnResponseAndWaitForWebhookDialogOpen}
            onOpenChange={setIsReturnResponseAndWaitForWebhookDialogOpen}
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
