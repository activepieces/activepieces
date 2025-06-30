import React from 'react';

import { Action, AgentTestResult, isNil, parseToJsonIfPossible, StepOutput } from '@activepieces/shared';
import { AgentTimeline } from '@/features/agents/agent-timeline';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: Action;
};

const FlowStepAgent = (props: FlowStepAgentProps) => {
  const { stepDetails } = props;

  const output: AgentTestResult | null = parseToJsonIfPossible(stepDetails.output) as AgentTestResult
  const prompt = !isNil(stepDetails.input) && 'prompt' in (stepDetails.input as { prompt: string }) ? (stepDetails.input as { prompt: string }).prompt : ''

  return (
    <AgentTimeline 
      steps={output?.steps || []}
      prompt={prompt}
      isLoading={isNil(output) || isNil(output.steps)}
    />
  );
};

export { FlowStepAgent };
