import {
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
  isFlowRunStateTerminal,
  FlowRun,
  FlowRunStatus,
  isNil,
  ApFlagId,
  LogSliceRef,
  StepOutput,
  StepOutputType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Download, Info, Timer } from 'lucide-react';
import { useMemo } from 'react';

import { StepOutputSkeleton } from '@/app/components/step-output-skeleton';
import { JsonViewer } from '@/components/custom/json-viewer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

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
        )
      : null;
  }, [run, selectedStep?.name, loopsIndexes, flowVersion.trigger]);
  const isAgent = isRunAgent(selectedStep);
  const isStepRunning = selectedStepOutput?.status === StepOutputStatus.RUNNING;
  const slicedOutputRef = extractSlicedOutputRef(selectedStepOutput);
  const parsedOutput = slicedOutputRef
    ? undefined
    : selectedStepOutput?.errorMessage ??
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
  const { data: rententionDays } = flagsHooks.useFlag<number>(
    ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
  );

  if (
    !isRunDone &&
    run.status !== FlowRunStatus.PAUSED &&
    isNil(selectedStepOutput)
  ) {
    return <StepOutputSkeleton className="p-4" />;
  }

  const message = handleRunFailureOrEmptyLog(run, rententionDays);
  if (message) {
    return (
      <div className="flex flex-col justify-center items-center gap-4 w-full pt-8  px-5">
        <Info size={36} className="text-muted-foreground" />
        <h4 className="px-6 text-sm text-center text-muted-foreground ">
          {message}
        </h4>
      </div>
    );
  }

  if (!selectedStepOutput || !selectedStep) {
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
              <StepOutputSkeleton className="p-4" />
            ) : slicedOutputRef ? (
              <div className="flex flex-col gap-3 p-4 bg-muted rounded-md">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>
                    {t(
                      'Output is too large to display inline ({size}). Download to inspect.',
                      {
                        size: formatUtils.formatStorageSize(
                          slicedOutputRef.size,
                        ),
                      },
                    )}
                  </span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2"
                >
                  <a
                    href={slicedOutputRef.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="w-4 h-4" />
                    {t('Download output')}
                  </a>
                </Button>
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

function extractSlicedOutputRef(
  stepOutput: StepOutput | null | undefined,
): LogSliceRef | undefined {
  if (stepOutput?.outputType !== StepOutputType.SLICE) {
    return undefined;
  }
  return stepOutput.output as LogSliceRef | undefined;
}

function handleRunFailureOrEmptyLog(
  run: FlowRun | null,
  retentionDays: number | null,
) {
  if (
    isNil(run) ||
    !isFlowRunStateTerminal({ status: run.status, ignoreInternalError: true })
  ) {
    return null;
  }

  if ([FlowRunStatus.INTERNAL_ERROR].includes(run.status)) {
    return t(
      'There are no logs captured for this run, because of an internal error, please contact support.',
    );
  }

  if (isNil(run.logsFileId)) {
    return t(
      'Logs are kept for {days} days after execution and then deleted.',
      { days: retentionDays },
    );
  }
  return null;
}
