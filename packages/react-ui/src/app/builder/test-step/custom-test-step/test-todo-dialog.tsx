import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PopulatedTodo, TodoType, Action } from '@activepieces/shared';
import { useBuilderStateContext } from '../../builder-hooks';
import { TodoDetails } from '@/app/routes/todos/todo-details';
import { useMutation } from '@tanstack/react-query';
import { todosApi } from '@/features/todos/lib/todos-api';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { FileType, FlowOperationType } from '@activepieces/shared';
import dayjs from 'dayjs';
import { toast } from '@/components/ui/use-toast';
import { INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';

type TodoTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: PopulatedTodo;
  flowVersionId: string;
  projectId: string;
  currentStep: Action;
  type: TodoType;
  setErrorMessage: (errorMessage: string | undefined) => void;
};

function TodoTestingDialog({
  open,
  onOpenChange,
  todo,
  flowVersionId,
  projectId,
  currentStep,
  type,
  setErrorMessage,
}: TodoTestingDialogProps) {
  const { setSampleData, setSampleDataInput, applyOperation } =
    useBuilderStateContext((state) => {
      return {
        sampleDataInput: state.sampleDataInput[currentStep.name],
        setSampleData: state.setSampleData,
        setSampleDataInput: state.setSampleDataInput,
        applyOperation: state.applyOperation,
      };
    });

  const { mutate: resolveTodo } = useMutation({
    mutationFn: async (status: PopulatedTodo['status']) => {
      const response = await todosApi.update(todo.id, {
        status: status,
        isTest: true,
      });
      let sampleDataFileId: string | undefined = undefined;
      if (response) {
        const sampleFile = await sampleDataApi.save({
          flowVersionId,
          stepName: currentStep.name,
          payload: {
            status: response.status.name,
          },
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
        success: true,
        output: response,
        sampleDataFileId,
        sampleDataInputFileId: sampleDataInputFile.id,
      };
    },
    onSuccess: ({ success, output, sampleDataFileId, sampleDataInputFileId }) => {
      if (success) {
        setErrorMessage(undefined);

        const newInputUiInfo: Action['settings']['inputUiInfo'] = {
          ...currentStep.settings.inputUiInfo,
          sampleDataFileId,
          sampleDataInputFileId,
          currentSelectedData: undefined,
          lastTestDate: dayjs().toISOString(),
        };
        const currentStepCopy: Action = JSON.parse(JSON.stringify(currentStep));
        currentStepCopy.settings.inputUiInfo = newInputUiInfo;
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: currentStepCopy,
        });
        const response = output as PopulatedTodo;
        const statusName = response['status'].name;
        const statusOptions = response['statusOptions'];
        const publicUrl = response['resolveUrl']?.split('/flow-runs/')[0];
        const links = statusOptions.map((option) => ({
          status: option.name,
          url:
            publicUrl +
            `/todos/${response.id}/resolve?status=${option.name}&isTest=true`,
        }));
        switch (type) {
          case TodoType.INTERNAL:
            setSampleData(currentStep.name, {
              status: statusName,
            });
            break;
          case TodoType.EXTERNAL:
            setSampleData(currentStep.name, {
              id: response.id,
              links,
            });
            break;
        }
        setSampleDataInput(currentStep.name, currentStep.settings);
        onOpenChange(false);
      }
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const handleStatusChange = (status: PopulatedTodo['status']) => {
    resolveTodo(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl  p-0 overflow-hidden">
        <TodoDetails 
          todoId={todo.id} 
          className="h-[90vh] p-3" 
          onStatusChange={handleStatusChange}
        />
      </DialogContent>
    </Dialog>
  );
}

export { TodoTestingDialog };
