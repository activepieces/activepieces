import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Action } from '@activepieces/shared';
import { testStepHooks } from '../test-step-hooks';

type AgentTestingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoId: string;
  currentStep: Action;
};

function AgentTestingDialog({
  open,
  onOpenChange,
  todoId,
  currentStep,
}: AgentTestingDialogProps) {
  const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
    currentStep.name,
  );

  const handleStatusChange = (output: unknown) => {
    updateSampleData({
      response: {
        output: output,
        success: true,
      },
      step: currentStep,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl p-0 overflow-hidden">
        <TodoDetails
          todoId={todoId}
          className="h-[90vh] p-3"
          onStatusChange={handleStatusChange}
        />
      </DialogContent>
    </Dialog>
  );
}

export { AgentTestingDialog };
