import React from 'react';

import { TodoDetails } from '@/app/routes/todos/todo-details';
import { Action, isNil, StepOutput } from '@activepieces/shared';

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
    <div className="px-4">
      {!isNil(todoId) && <TodoDetails todoId={todoId} hideTitle={true} />}
    </div>
  );
});

FlowStepAgent.displayName = 'FlowStepAgent';
export { FlowStepAgent };
