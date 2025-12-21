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
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
} from '@activepieces/shared';
import { useBuilderStateContext } from '../builder-hooks';
import { useMemo } from 'react';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';



export const FlowStepInputOutput = () => {
  const [run, loopsIndexes, flowVersion, selectedStep] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.flowVersion,
    state.selectedStep ? flowStructureUtil.getStepOrThrow(state.selectedStep, state.flowVersion.trigger) : null,
  ]);
  const selectedStepOutput = useMemo(() => {
    return run && selectedStep && run.steps
      ? flowRunUtils.extractStepOutput(
        selectedStep.name,
          loopsIndexes,
          run.steps,
          flowVersion.trigger,
        )
      : null;
  }, [run, selectedStep?.name, loopsIndexes, flowVersion.trigger]);
  const isAgent = selectedStep ? flowStructureUtil.isAgentPiece(selectedStep) : false;
  const isRunning =
  selectedStepOutput?.status === StepOutputStatus.RUNNING ||
  selectedStepOutput?.status === StepOutputStatus.PAUSED;

  const parsedOutput =
    selectedStepOutput?.errorMessage ?? selectedStepOutput?.output ?? 'No output';

  const tabCount = isAgent ? 3 : 2;
  const gridCols = tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

  if (!selectedStepOutput || !selectedStep) {
    return null;
  }
  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-base font-medium">
          <StepStatusIcon status={selectedStepOutput.status} size="5" />
          <span>{selectedStep.displayName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>
            {t('Duration')}:{' '}
            {formatUtils.formatDuration(selectedStepOutput.duration ?? 0, false)}
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
            <JsonViewer json={selectedStepOutput.input} title={t('Input')} />
          </TabsContent>

          <TabsContent value="timeline">
            <AgentTimeline agentResult={selectedStepOutput.output as AgentResult} />
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
