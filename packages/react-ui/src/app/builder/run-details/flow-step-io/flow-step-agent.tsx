import React from 'react';

import { TodoDetails } from '@/app/routes/todos/todo-details';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Action, isNil, StepOutput } from '@activepieces/shared';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: Action;
};

const FlowStepAgent = React.memo((props: FlowStepAgentProps) => {
  const { stepDetails } = props;

  const todoId = getTodoId(stepDetails?.output ?? stepDetails?.errorMessage);

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

function getTodoId(output: unknown) {
  const castedOutput =
    typeof output === 'object'
      ? output
      : typeof output === 'string'
      ? JSON.parse(output)
      : null;
  return !isNil(castedOutput) && 'todoId' in castedOutput
    ? (castedOutput.todoId as string)
    : null;
}
