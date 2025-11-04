import { t } from 'i18next';
import { Timer } from 'lucide-react';

import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import {
  FlowAction,
  StepOutput,
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
} from '@activepieces/shared';

type Props = {
  stepDetails: StepOutput;
  selectedStep: FlowAction;
};

export const FlowStepInputOutput = ({ stepDetails, selectedStep }: Props) => {
  const isAgent = flowStructureUtil.isAgentPiece(selectedStep);
  const isRunning =
    stepDetails.status === StepOutputStatus.RUNNING ||
    stepDetails.status === StepOutputStatus.PAUSED;

  const parsedOutput =
    stepDetails.errorMessage ?? stepDetails.output ?? 'No output';

  const tabCount = isAgent ? 3 : 2;
  const gridCols = tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-base font-medium">
          <StepStatusIcon status={stepDetails.status} size="5" />
          <span>{selectedStep.displayName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>
            {t('Duration')}:{' '}
            {formatUtils.formatDuration(stepDetails.duration ?? 0, false)}
          </span>
        </div>

        <Tabs defaultValue={isAgent ? 'timeline' : 'input'} className="w-full">
          <TabsList className={`w-full grid ${gridCols}`}>
            <TabsTrigger value="input">{t('Input')}</TabsTrigger>
            {isAgent && (
              <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
            )}
            <TabsTrigger value="output">{t('Output')}</TabsTrigger>
          </TabsList>

          <TabsContent value="input">
            <JsonViewer json={stepDetails.input} title={t('Input')} />
          </TabsContent>

          <TabsContent value="timeline">
            <AgentTimeline agentResult={stepDetails.output as AgentResult} />
          </TabsContent>

          <TabsContent value="output">
            {isRunning ? (
              <div className="mt-4 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ) : (
              <JsonViewer json={parsedOutput} title={t('Output')} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
