import {
  StepOutputStatus,
  flowStructureUtil,
  AgentResult,
  FlowActionType,
  FlowTriggerType,
  isFlowRunStateTerminal,
  FlowRun,
  FlowRunStatus,
  isNil,
  ApFlagId,
  LogSliceRef,
  StepOutputType,
  tryParseFriendlyPieceError,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Download, Info } from 'lucide-react';
import { useMemo, useState } from 'react';

import { StepOutputSkeleton } from '@/app/components/step-output-skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentTimeline } from '@/features/agents';
import { flowRunUtils } from '@/features/flow-runs';
import { piecesHooks } from '@/features/pieces';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

import { useBuilderStateContext } from '../builder-hooks';
import { stepPropertiesSnapshotUtils } from '../data-display/build-step-properties-snapshot';
import { DataDisplayTabs } from '../data-display/data-display-tabs';
import { ErrorExplanationContext } from '../data-display/explanation-prompt';
import { FriendlyErrorView } from '../data-display/friendly-error-view';
import { isRunAgent } from '../test-step/agent-test-step';
import { TestPanelHeader } from '../test-step/test-panel-header';
import { TestPanelViewToggle } from '../test-step/test-panel-view-toggle';

type RunActiveTab = 'input' | 'output' | 'timeline';

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
  const isAgent = isRunAgent(selectedStep);
  const [requestedTab, setActiveTab] = useState<RunActiveTab>(
    isAgent ? 'timeline' : 'output',
  );
  const activeTab: RunActiveTab =
    requestedTab === 'timeline' && !isAgent ? 'output' : requestedTab;
  const selectedStepOutput = useMemo(() => {
    return run && selectedStep && run.steps
      ? flowRunUtils.extractStepOutput(
          selectedStep.name,
          loopsIndexes,
          run.steps,
        )
      : null;
  }, [run, selectedStep?.name, loopsIndexes, flowVersion.trigger]);
  const isStepRunning = selectedStepOutput?.status === StepOutputStatus.RUNNING;
  const isSlicedOutput =
    selectedStepOutput?.outputType === StepOutputType.SLICE;
  const slicedOutputRef = isSlicedOutput
    ? (selectedStepOutput?.output as LogSliceRef | undefined)
    : undefined;
  const friendlyError = tryParseFriendlyPieceError(
    selectedStepOutput?.errorMessage,
  );
  const stepPieceName =
    selectedStep?.type === FlowActionType.PIECE ||
    selectedStep?.type === FlowTriggerType.PIECE
      ? selectedStep.settings.pieceName
      : undefined;
  const stepPieceVersion =
    selectedStep?.type === FlowActionType.PIECE ||
    selectedStep?.type === FlowTriggerType.PIECE
      ? selectedStep.settings.pieceVersion
      : undefined;
  const { pieceModel } = piecesHooks.usePiece({
    name: stepPieceName ?? '',
    version: stepPieceVersion,
    enabled: !isNil(stepPieceName),
  });
  const parsedOutput = isSlicedOutput
    ? undefined
    : selectedStepOutput?.errorMessage ??
      selectedStepOutput?.output ??
      'No output';

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
      <div className="flex flex-col h-full w-full">
        <div className="flex justify-end px-3 py-2 shrink-0">
          <TestPanelViewToggle />
        </div>
        <div className="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
          <div className="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground">
            <Info className="size-6" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-[280px]">
            <span className="text-sm font-medium text-foreground">
              {t("This step didn't run")}
            </span>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {t(
                'This step was skipped during this run, no input or output was captured.',
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }
  const status: 'success' | 'failed' | 'testing' | 'idle' =
    selectedStepOutput.status === StepOutputStatus.FAILED
      ? 'failed'
      : selectedStepOutput.status === StepOutputStatus.RUNNING
      ? 'testing'
      : 'success';

  const stepKind: 'action' | 'trigger' =
    selectedStep.type === FlowTriggerType.PIECE ? 'trigger' : 'action';
  const stepName =
    selectedStep.type === FlowActionType.PIECE
      ? selectedStep.settings.actionName
      : selectedStep.type === FlowTriggerType.PIECE
      ? selectedStep.settings.triggerName
      : selectedStep.type;
  const stepInput =
    selectedStep.type === FlowActionType.PIECE ||
    selectedStep.type === FlowTriggerType.PIECE
      ? (selectedStep.settings.input as Record<string, unknown> | undefined)
      : undefined;
  const explanationContext: ErrorExplanationContext = {
    pieceName: stepPieceName,
    pieceVersion: stepPieceVersion,
    pieceDisplayName: pieceModel?.displayName,
    pieceAuthType: stepPropertiesSnapshotUtils.findAuthType(pieceModel),
    stepKind,
    stepName,
    stepDisplayName: selectedStep.displayName,
    stepDescription: stepPropertiesSnapshotUtils.findDescription({
      pieceModel,
      stepKind,
      stepName,
    }),
    stepProperties: stepPropertiesSnapshotUtils.build({
      pieceModel,
      stepKind,
      stepName,
      input: stepInput,
    }),
  };

  return (
    <div className="h-full flex flex-col">
      <TestPanelHeader
        status={status}
        lastTestDate={run.created}
        viewMode="run"
      />
      <ScrollArea className="flex-1 p-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as RunActiveTab)}
          className="w-full"
        >
          <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
            <TabsList className="h-9">
              <TabsTrigger value="input">{t('Input')}</TabsTrigger>
              {isAgent && (
                <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
              )}
              <TabsTrigger value="output">{t('Output')}</TabsTrigger>
            </TabsList>
            <TestPanelViewToggle />
          </div>

          <TabsContent value="input">
            <DataDisplayTabs
              data={selectedStepOutput.input}
              title={t('Input')}
              copyableData={selectedStepOutput.input}
              downloadFileName={`${selectedStep.name}-input`}
            />
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
              <SlicedOutputDownload slicedOutputRef={slicedOutputRef} />
            ) : friendlyError ? (
              <FriendlyErrorView
                error={friendlyError}
                explanationContext={explanationContext}
                pieceDisplayName={pieceModel?.displayName}
              />
            ) : (
              <DataDisplayTabs
                data={parsedOutput}
                title={t('Output')}
                copyableData={parsedOutput}
                downloadFileName={`${selectedStep.name}-output`}
              />
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};

const SlicedOutputDownload = ({
  slicedOutputRef,
}: {
  slicedOutputRef: LogSliceRef;
}) => (
  <div className="flex flex-col gap-3 p-4 bg-muted rounded-md">
    <div className="flex items-start gap-2 text-sm">
      <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <span>
        {t(
          'Output is too large to display inline ({size}). Download to inspect.',
          { size: formatUtils.formatStorageSize(slicedOutputRef.size) },
        )}
      </span>
    </div>
    <Button asChild variant="outline" size="sm" className="w-fit gap-2">
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
);

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
