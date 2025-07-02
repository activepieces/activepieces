import React from 'react';

import { AgentTimeline } from '@/features/agents/agent-timeline';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import {
  Action,
  AgentTaskStatus,
  AgentTestResult,
  isNil,
  parseToJsonIfPossible,
  PieceAction,
  StepOutput,
} from '@activepieces/shared';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: PieceAction;
};

const FlowStepAgent = (props: FlowStepAgentProps) => {
  const { stepDetails } = props;
  const agentId = stepUtils.getAgentId(props.selectedStep);
  const output: AgentTestResult | null = parseToJsonIfPossible(
    stepDetails.output,
  ) as AgentTestResult;
  const prompt =
    !isNil(stepDetails.input) &&
    'prompt' in (stepDetails.input as { prompt: string })
      ? (stepDetails.input as { prompt: string }).prompt
      : '';
  const isDone =
    output?.status === AgentTaskStatus.COMPLETED ||
    output?.status === AgentTaskStatus.FAILED;

  return (
    <AgentTimeline
      prompt={prompt}
      isDone={isDone}
      agentId={agentId ?? ''}
      steps={output?.steps || []}
    />
  );
};

export { FlowStepAgent };
