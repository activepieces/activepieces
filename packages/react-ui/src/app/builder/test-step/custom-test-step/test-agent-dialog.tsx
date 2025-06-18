import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { todoActivityApi } from '@/features/todos/lib/todos-activitiy-api';
import {
  Action,
  agentMarkdownParser,
  AgentTestResult,
} from '@activepieces/shared';

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

  const handleStatusChange = async () => {
    const activities = await todoActivityApi.list(todoId, {
      limit: 100,
    });
    const agentResult: AgentTestResult = agentMarkdownParser.findAgentResult({
      todoId,
      output: activities.data[activities.data.length - 1].content,
    });
    updateSampleData({
      response: {
        output: agentResult,
        success: true,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl p-0 overflow-hidden">
        <TodoDetails
          todoId={todoId}
          className="h-[90vh] py-3 px-6"
          onStatusChange={handleStatusChange}
        />
      </DialogContent>
    </Dialog>
  );
}

export { AgentTestingDialog };
