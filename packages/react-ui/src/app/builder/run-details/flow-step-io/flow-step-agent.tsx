import React from 'react';

import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Action, isNil, StepOutput } from '@activepieces/shared';
import { ScrollArea } from '@/components/ui/scroll-area';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: Action;
};

const FlowStepAgent = React.memo((props: FlowStepAgentProps) => {
  const { stepDetails } = props;

  const castedOutput = stepDetails?.output as Record<string, unknown>;
  const todoId =
    !isNil(castedOutput) && 'todoId' in castedOutput
      ? (castedOutput.todoId as string)
      : null;

  return (
    <ScrollArea className="h-full p-4">
      <div className="px-4 py-2 flex flex-col">
        {!isNil(todoId) && <TodoDetails todoId={todoId} simpleTitle={true} />}
      </div>
    </ScrollArea>
  );
});

FlowStepAgent.displayName = 'FlowStepAgent';
export { FlowStepAgent };
