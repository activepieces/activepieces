import {
  StepOutputStatus,
  StepOutput,
  flowStructureUtil,
  executionJournal,
  AgentResult,
  isFlowRunStateTerminal,
  FlowRun,
  FlowRunStatus,
  isNil,
  ApFlagId,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Info, Timer } from 'lucide-react';
import { useMemo } from 'react';

import { StepOutputSkeleton } from '@/app/components/step-output-skeleton';
import { JsonViewer } from '@/components/custom/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents';
import { flowRunsApi } from '@/features/flow-runs/api/flow-runs-api';
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
  const selectedStepData = useMemo(() => {
    return run && selectedStep && run.steps
      ? flowRunUtils.extractStepOutput(
          selectedStep.name,
          loopsIndexes,
          run.steps,
        )
      : null;
  }, [run, selectedStep?.name, loopsIndexes, flowVersion.trigger]);

  const stepPath = useMemo(() => {
    if (!run?.stepsDataTruncated || !selectedStep || !run.steps) {
      return undefined;
    }
    return (
      executionJournal.getPathToStep(
        run.steps,
        selectedStep.name,
        loopsIndexes,
      ) ?? []
    );
  }, [run, selectedStep?.name, loopsIndexes]);

  const { data: fetchedStepData, isLoading: isStepDataLoading } = useQuery({
    queryKey: [
      'stepData',
      run?.id,
      selectedStep?.name,
      JSON.stringify(stepPath),
    ],
    queryFn: () =>
      flowRunsApi.getStepOutput(run!.id, selectedStep!.name, stepPath!),
    enabled:
      run?.stepsDataTruncated === true &&
      !isNil(selectedStep) &&
      !isNil(stepPath),
    staleTime: Infinity,
  });

  const isAgent = isRunAgent(selectedStep);

  const stepDataState = resolveStepDataState({
    isTruncated: run?.stepsDataTruncated === true,
    selectedStepData: selectedStepData ?? undefined,
    fetchedStepData,
    isLoading: isStepDataLoading,
  });

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
    stepDataState.status === StepDataStatus.MISSING
  ) {
    return <StepOutputSkeleton className="p-4" />;
  }

  if (stepDataState.status === StepDataStatus.LOADING) {
    return (
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-base font-medium">
            <StepStatusIcon status={stepDataState.metadata.status} size="4.5" />
            <span>{selectedStep?.displayName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>
              {t('Duration')}:{' '}
              {formatUtils.formatDuration(
                stepDataState.metadata.duration ?? 0,
                false,
              )}
            </span>
          </div>
          <StepOutputSkeleton className="p-4" />
        </div>
      </ScrollArea>
    );
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

  if (stepDataState.status === StepDataStatus.MISSING || !selectedStep) {
    return (
      <div className="px-4 bg-muted rounded-md m-4 py-2 flex items-center gap-1.5">
        <Info className="w-4 h-4" />
        <span>{t("This step didn't run")}</span>
      </div>
    );
  }

  const { fullData } = stepDataState;
  const parsedOutput = fullData.errorMessage ?? fullData.output ?? 'No output';

  return (
    <ScrollArea className="h-full p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-base font-medium">
          <StepStatusIcon status={fullData.status} size="4.5" />
          <span>{selectedStep.displayName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>
            {t('Duration')}:{' '}
            {formatUtils.formatDuration(fullData.duration ?? 0, false)}
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
            <JsonViewer json={fullData.input} title={t('Input')} />
          </TabsContent>

          {isAgent && (
            <TabsContent value="timeline">
              <AgentTimeline
                agentResult={fullData.output as AgentResult}
              />
            </TabsContent>
          )}
          <TabsContent value="output">
            {fullData.status === StepOutputStatus.RUNNING ? (
              <StepOutputSkeleton className="p-4" />
            ) : (
              <JsonViewer json={parsedOutput} title={t('Output')} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

enum StepDataStatus {
  MISSING,
  LOADING,
  READY
}

type StepDataState =
  | { status: StepDataStatus.MISSING }
  | { status: StepDataStatus.LOADING; metadata: StepOutput }
  | { status: StepDataStatus.READY; fullData: StepOutput };

function resolveStepDataState({
  isTruncated,
  selectedStepData,
  fetchedStepData,
  isLoading,
}: {
  isTruncated: boolean;
  selectedStepData: StepOutput | undefined;
  fetchedStepData: StepOutput | undefined;
  isLoading: boolean;
}): StepDataState {
  if (!selectedStepData) {
    return { status: StepDataStatus.MISSING };
  }
  if (!isTruncated) {
    return { status: StepDataStatus.READY, fullData: selectedStepData };
  }
  if (fetchedStepData) {
    return { status: StepDataStatus.READY, fullData: fetchedStepData };
  }
  if (isLoading) {
    return { status: StepDataStatus.LOADING, metadata: selectedStepData };
  }
  return { status: StepDataStatus.MISSING };
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
