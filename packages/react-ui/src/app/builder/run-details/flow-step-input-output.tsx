import { t } from 'i18next';
import { Info, Timer } from 'lucide-react';
import { useMemo } from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { formatUtils } from '@/lib/utils';
import {
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
  isFlowRunStateTerminal,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { isRunAgent } from '../test-step/agent-test-step';

export const FlowStepInputOutput = () => {
  const [run, loopsIndexes, flowVersion, selectedStep] = useBuilderStateContext(
    (state) => [
      state.run,
      state.loopsIndexes,
      state.flowVersion,
      state.selectedStep
        ? flowStructureUtil.getStepOrThrow(
            state.selectedStep,
            state.flowVersion.trigger,
          )
        : null,
    ],
  );
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
  const isAgent = isRunAgent(selectedStep);
  const isStepRunning =
    selectedStepOutput?.status === StepOutputStatus.RUNNING ||
    selectedStepOutput?.status === StepOutputStatus.PAUSED;
  const parsedOutput =
    selectedStepOutput?.errorMessage ??
    selectedStepOutput?.output ??
    'No output';

  const tabCount = isAgent ? 3 : 2;
  const gridCols = tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2';
  if (!run) {
    return <></>;
  }
  const isRunDone = isFlowRunStateTerminal({
    status: run.status,
    ignoreInternalError: true,
  });
  if (!selectedStepOutput || !selectedStep) {
    if (!isRunDone) {
      return <OutputSkeleton />;
    }
    return (
      <div className="px-4 bg-muted rounded-md m-4 py-2 flex items-center gap-1.5">
        <Info className="w-4 h-4" />
        <span>{t("This step didn't run")}</span>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-base font-medium">
          <StepStatusIcon status={selectedStepOutput.status} size="4.5" />
          <span>{selectedStep.displayName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>
            {t('Duration')}:{' '}
            {formatUtils.formatDuration(
              selectedStepOutput.duration ?? 0,
              false,
            )}
          </span>
        </div>

        <Tabs defaultValue={isAgent ? 'timeline' : 'output'} className="w-full">
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

          {isAgent && (
            <TabsContent value="timeline">
              <AgentTimeline
                agentResult={selectedStepOutput.output as AgentResult}
              />
            </TabsContent>
          )}
          <TabsContent value="output">
            {isStepRunning ? (
              <OutputSkeleton />
            ) : (
              <JsonViewer json={parsedOutput} title={t('Output')} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

const OutputSkeleton = () => {
  return (
    <div className="flex  w-full  h-full  p-4">
      <div className="space-y-2 grow">
        <div className="flex items-center gap-2">
          <Skeleton className="w-40 h-4" />
        </div>
        <Skeleton className="w-full h-40" />
      </div>
    </div>
  );
};
