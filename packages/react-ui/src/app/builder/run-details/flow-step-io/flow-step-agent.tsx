import { t } from 'i18next';
import { Bot } from 'lucide-react';

import { AgentTimeline } from '@/features/agents/agent-timeline';
import { AgentResult, PieceAction, StepOutput } from '@activepieces/shared';

type FlowStepAgentProps = {
  stepDetails: StepOutput;
  selectedStep: PieceAction;
};

const FlowStepAgent = (props: FlowStepAgentProps) => {
  return (
    <>
      <div className="flex gap-2 items-center">
        <Bot className="size-5" />
        {t('Agent Output')}
      </div>
      <AgentTimeline agentResult={props.stepDetails.output as AgentResult} />
    </>
  );
};

export { FlowStepAgent };
