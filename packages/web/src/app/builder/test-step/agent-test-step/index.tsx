import {
  AgentResult,
  AgentTaskStatus,
  AI_PIECE_NAME,
  FlowActionType,
  isNil,
  Step,
} from '@activepieces/shared';
import { t } from 'i18next';

import { DataDisplayTabs } from '@/app/builder/data-display/data-display-tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents';

export const isRunAgent = (step?: Step | null) => {
  return (
    !isNil(step) &&
    step.type === FlowActionType.PIECE &&
    step.settings.pieceName === AI_PIECE_NAME &&
    step.settings.actionName === 'run_agent'
  );
};

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
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
          <TabsTrigger value="output">{t('Output')}</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <AgentTimeline agentResult={agentResult} />
        </TabsContent>
        <TabsContent value="output">
          <DataDisplayTabs
            data={errorMessage ?? agentResult}
            title={t('Output')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
