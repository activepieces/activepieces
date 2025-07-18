import { t } from 'i18next';
import { Bot } from 'lucide-react';
import React from 'react';

import { AgentTimeline } from '@/features/agents/agent-timeline';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import {
  AgentTaskStatus,
  AgentRun,
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
  const output: AgentRun | null = parseToJsonIfPossible(
    stepDetails.output,
  ) as AgentRun;
  const prompt =
    !isNil(stepDetails.input) &&
    'prompt' in (stepDetails.input as { prompt: string })
      ? (stepDetails.input as { prompt: string }).prompt
      : '';
  const isDone =
    output?.status === AgentTaskStatus.COMPLETED ||
    output?.status === AgentTaskStatus.FAILED;

  return (
    <>
      <div className="flex gap-2 items-center px-4 mt-4">
        <Bot className="size-5" />
        {t('Agent Output')}
      </div>
      <AgentTimeline
        prompt={prompt}
        isDone={isDone}
        agentId={agentId ?? ''}
        steps={output?.steps || []}
      />
    </>
  );
};

export { FlowStepAgent };
