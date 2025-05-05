import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useState } from 'react';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { todosApi } from '@/features/todos/lib/todos-api';
import {
  ActionType,
  FileType,
  FlowOperationType,
  Step,
  StepRunResponse,
  TodoType,
  TodoWithAssignee,
  TriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { flowRunsApi } from '../../../features/flow-runs/lib/flow-runs-api';
import { useBuilderStateContext } from '../builder-hooks';

import { ManualTaskTestingDialog } from './custom-test-step/todos-create-task';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepUtils } from './test-step-utils';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

function isTodoCreateTask(step: Step): boolean {
  return (
    step.type === ActionType.PIECE &&
    step.settings.pieceName === '@activepieces/piece-todos' &&
    step.settings.actionName === 'createTodoAndWait'
  );
}

const TestStepSectionImplementation = React.memo(
  ({
    isSaving,
    flowVersionId,
    projectId,
    currentStep,
  }: TestActionComponentProps & { currentStep: Step }) => {
    const { toast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );
    const [consoleLogs, setConsoleLogs] = useState<null | string>(null);
    const socket = useSocket();
    const [isTodoCreateTaskDialogOpen, setIsTodoCreateTaskDialogOpen] =
      useState(false);
    const [todo, setTodo] = useState<TodoWithAssignee | null>(null);
    const {
      sampleData,
      sampleDataInput,
      setSampleData,
      setSampleDataInput,
      applyOperation,
    } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[currentStep.name],
        sampleDataInput: state.sampleDataInput[currentStep.name],
        setSampleData: state.setSampleData,
        setSampleDataInput: state.setSampleDataInput,
        applyOperation: state.applyOperation,
      };
    });
    const { mutate, isPending: isTesting } = useMutation<
      StepRunResponse & {
        sampleDataFileId?: string;
        sampleDataInputFileId?: string;
      },
      Error,
      void
    >({
      mutationFn: async () => {
        const testStepResponse = await flowRunsApi.testStep(socket, {
          flowVersionId,
          stepName: currentStep.name,
        });
        let sampleDataFileId: string | undefined = undefined;
        if (testStepResponse.success && !isNil(testStepResponse.output)) {
          const sampleFile = await sampleDataApi.save({
            flowVersionId,
            stepName: currentStep.name,
            payload: testStepResponse.output,
            projectId,
            fileType: FileType.SAMPLE_DATA,
          });
          sampleDataFileId = sampleFile.id;
        }
        const sampleDataInputFile = await sampleDataApi.save({
          flowVersionId,
          stepName: currentStep.name,
          payload: currentStep.settings,
          projectId,
          fileType: FileType.SAMPLE_DATA_INPUT,
        });
        return {
          ...testStepResponse,
          sampleDataFileId,
          sampleDataInputFileId: sampleDataInputFile.id,
        };
      },
      onSuccess: ({
        success,
        input,
        output,
        sampleDataFileId,
        sampleDataInputFileId,
        standardOutput,
        standardError,
      }) => {
        if (success) {
          setErrorMessage(undefined);

          const newInputUiInfo: Step['settings']['inputUiInfo'] = {
            ...currentStep.settings.inputUiInfo,
            sampleDataFileId,
            sampleDataInputFileId,
            currentSelectedData: undefined,
            lastTestDate: dayjs().toISOString(),
          };
          const currentStepCopy = {
            ...currentStep,
            settings: {
              ...currentStep.settings,
              inputUiInfo: newInputUiInfo,
            },
          };
          if (
            currentStepCopy.type === TriggerType.EMPTY ||
            currentStepCopy.type === TriggerType.PIECE
          ) {
            applyOperation({
              type: FlowOperationType.UPDATE_TRIGGER,
              request: currentStepCopy,
            });
          } else {
            applyOperation({
              type: FlowOperationType.UPDATE_ACTION,
              request: currentStepCopy,
            });
          }
        } else {
          setErrorMessage(
            testStepUtils.formatErrorMessage(
              JSON.stringify(output) ||
                t('Failed to run test step and no error message was returned'),
            ),
          );
        }
        setSampleData(currentStep.name, output);
        setSampleDataInput(currentStep.name, input);
        setConsoleLogs(standardOutput || standardError);
        setLastTestDate(dayjs().toISOString());
      },
      onError: (error) => {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
      },
    });

    const [lastTestDate, setLastTestDate] = useState(
      currentStep.settings.inputUiInfo?.lastTestDate,
    );

    const sampleDataExists = !isNil(lastTestDate) || !isNil(errorMessage);

    const handleTodoCreateTask = async () => {
      setIsTodoCreateTaskDialogOpen(true);
      const testStepResponse = await flowRunsApi.testStep(socket, {
        flowVersionId,
        stepName: currentStep.name,
      });
      const output = testStepResponse.output as TodoWithAssignee;
      if (testStepResponse.success && !isNil(output)) {
        const task = await todosApi.get(output.id as string);
        setTodo(task);
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
                onClick={async () => {
                  if (isTodoCreateTask(currentStep)) {
                    handleTodoCreateTask();
                  } else {
                    mutate();
                  }
                }}
                keyboardShortcut="G"
                onKeyboardShortcut={() => {
                  if (isTodoCreateTask(currentStep)) {
                    handleTodoCreateTask();
                  } else {
                    mutate();
                  }
                }}
                loading={isTesting || isTodoCreateTaskDialogOpen}
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
            onRetest={() => {
              if (isTodoCreateTask(currentStep)) {
                handleTodoCreateTask();
              } else {
                mutate();
              }
            }}
            isValid={currentStep.valid}
            isSaving={isSaving}
            isTesting={isTesting || isTodoCreateTaskDialogOpen}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            consoleLogs={
              currentStep.type === ActionType.CODE ? consoleLogs : null
            }
          ></TestSampleDataViewer>
        )}
        {isTodoCreateTaskDialogOpen && todo && (
          <ManualTaskTestingDialog
            open={isTodoCreateTaskDialogOpen}
            onOpenChange={setIsTodoCreateTaskDialogOpen}
            todo={todo}
            flowVersionId={flowVersionId}
            projectId={projectId}
            currentStep={currentStep}
            setErrorMessage={setErrorMessage}
            setLastTestDate={setLastTestDate}
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

const TestActionSection = React.memo((props: TestActionComponentProps) => {
  const currentStep = useBuilderStateContext((state) =>
    state.selectedStep
      ? flowStructureUtil.getStep(state.selectedStep, state.flowVersion.trigger)
      : null,
  );
  if (isNil(currentStep)) {
    return null;
  }
  return <TestStepSectionImplementation {...props} currentStep={currentStep} />;
});

TestStepSectionImplementation.displayName = 'TestStepSectionImplementation';
TestActionSection.displayName = 'TestActionSection';

export { TestActionSection };
