import { useMutation } from '@tanstack/react-query';

import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { todosApi } from '@/features/todos/lib/todos-api';
import {
  PopulatedTodo,
  TodoType,
  FlowAction,
  CreateTodoResult,
  CreateAndWaitTodoResult,
} from '@activepieces/shared';

import { testStepHooks } from '../test-step-hooks';

type TodoTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: PopulatedTodo;
  currentStep: FlowAction;
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

  const formatTodoResult = (
    response: PopulatedTodo,
  ): CreateTodoResult | CreateAndWaitTodoResult => {
    if (type === TodoType.INTERNAL) {
      return {
        status: response.status.name,
      };
    }
    const publicUrl = response.resolveUrl?.split('/flow-runs/')[0];
    const links = response.statusOptions.map((option) => ({
      name: option.name,
      url: `${publicUrl}/todos/${response.id}/resolve?status=${option.name}&isTest=true`,
    }));
    return {
      id: response.id,
      links,
    };
  };

  const { mutate: resolveTodo } = useMutation({
    mutationFn: async (status: PopulatedTodo['status']) => {
      return await todosApi.update(todo.id, {
        status: status,
        isTest: true,
      });
    },
    onSuccess: (response) => {
      setErrorMessage(undefined);
      const output = formatTodoResult(response);
      updateSampleData({
        response: { output, success: true },
      });
      onOpenChange(false);
    },
  });

  const handleStatusChange = (status: PopulatedTodo['status']) => {
    resolveTodo(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl  p-3 overflow-hidden">
        <TodoDetails todoId={todo.id} onStatusChange={handleStatusChange} />
      </DialogContent>
    </Dialog>
  );
}

export { TodoTestingDialog };
