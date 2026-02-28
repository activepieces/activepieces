import {
  AgentResult,
  AgentTaskStatus,
  AI_PIECE_NAME,
  FlowActionKind,
  FlowGraphNode,
  FlowNodeData,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';

import { JsonViewer } from '@/components/json-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents/agent-timeline';

export const isRunAgent = (step?: FlowGraphNode | FlowNodeData | null) => {
  if (isNil(step)) return false;
  const data = isFlowGraphNode(step) ? step.data : step;
  return (
    data.kind === FlowActionKind.PIECE &&
    data.settings.pieceName === AI_PIECE_NAME &&
    data.settings.actionName === 'run_agent'
  );
};

function isFlowGraphNode(
  step: FlowGraphNode | FlowNodeData,
): step is FlowGraphNode {
  return 'data' in step && 'type' in step && typeof step.type === 'string';
}

export const defaultAgentOutput = {
  prompt: '',
  status: AgentTaskStatus.IN_PROGRESS,
  steps: [],
  message: null,
};

type AgentTestStepProps = {
  agentResult?: AgentResult;
  errorMessage?: string | null;
};

export const AgentTestStep = ({
  agentResult,
  errorMessage,
}: AgentTestStepProps) => {
  return (
    <div className="flex flex-col justify-center w-full items-start">
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-[250px] grid grid-cols-2">
          <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
          <TabsTrigger value="output">{t('Output')}</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <AgentTimeline agentResult={agentResult} />
        </TabsContent>
        <TabsContent value="output">
          <JsonViewer json={errorMessage ?? agentResult} title={t('Output')} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
