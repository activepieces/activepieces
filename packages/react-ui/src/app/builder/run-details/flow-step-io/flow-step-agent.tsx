import { t } from 'i18next';
import { Bot } from 'lucide-react';

import { AgentTimeline } from '@/features/agents/agent-timeline';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { PieceAction, StepOutput } from '@activepieces/shared';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: PieceAction;
};

const FlowStepAgent = (props: FlowStepAgentProps) => {
  const agentRunId = stepUtils.getAgentRunId(props.stepDetails);

  return (
    <>
      <div className="flex gap-2 items-center px-4 my-3">
        <Bot className="size-5" />
        {t('Agent Output')}
      </div>
      {agentRunId && (
        <AgentTimeline agentRunId={agentRunId} className="px-4 pb-2 mr-2" />
      )}
    </>
  );
};

export { FlowStepAgent };
