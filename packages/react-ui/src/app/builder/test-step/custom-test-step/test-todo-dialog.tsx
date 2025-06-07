import { useMutation } from '@tanstack/react-query';

import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast, INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';
import { todosApi } from '@/features/todos/lib/todos-api';
import { PopulatedTodo, TodoType, Action } from '@activepieces/shared';

import { testStepHooks } from '../test-step-hooks';

type TodoTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: PopulatedTodo;
  currentStep: Action;
  type: TodoType;
  setErrorMessage: (errorMessage: string | undefined) => void;
};

function TodoTestingDialog({
  open,
  onOpenChange,
  todo,
  currentStep,
  type,
  setErrorMessage,
}: TodoTestingDialogProps) {
  const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
    currentStep.name,
  );

  const { mutate: resolveTodo } = useMutation({
    mutationFn: async (status: PopulatedTodo['status']) => {
      return await todosApi.update(todo.id, {
        status: status,
        isTest: true,
      });
    },
    onSuccess: (response) => {
      setErrorMessage(undefined);
      const statusName = response.status.name;
      const statusOptions = response.statusOptions;
      const publicUrl = response.resolveUrl?.split('/flow-runs/')[0];
      const links = statusOptions.map((option) => ({
        status: option.name,
        url:
          publicUrl +
          `/todos/${response.id}/resolve?status=${option.name}&isTest=true`,
      }));

      const output =
        type === TodoType.INTERNAL
          ? { status: statusName }
          : { id: response.id, links };

      updateSampleData({
        response: { output, success: true },
        step: currentStep,
      });
      onOpenChange(false);
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
