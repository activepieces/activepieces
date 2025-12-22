import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';

import {
  RightSideBarType,
  useBuilderStateContext,
  useShowBuilderIsSavingWarningBeforeLeaving,
  useSwitchToDraft,
} from '@/app/builder/builder-hooks';
import { DataSelector } from '@/app/builder/data-selector';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { StepSettingsProvider } from '@/app/builder/step-settings/step-settings-context';
import { ChatDrawer } from '@/app/routes/chat/chat-drawer';
import { ShowPoweredBy } from '@/components/show-powered-by';
import { useSocket } from '@/components/socket-provider';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { RunStatus } from '@/features/flow-runs/components/run-status';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  FlowAction,
  FlowActionType,
  FlowRunStatus,
  FlowTrigger,
  FlowTriggerType,
  FlowVersionState,
  WebsocketClientEvent,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { cn, useElementSize } from '../../lib/utils';

import { BuilderHeader } from './builder-header/builder-header';
import { FlowCanvas } from './flow-canvas';
import { FlowVersionsList } from './flow-versions';
import { RunsList } from './run-list';
import { StepSettingsContainer } from './step-settings';
import { toast } from 'sonner';
import { t } from 'i18next';

const minWidthOfSidebar = 'min-w-[max(20vw,400px)]';
const animateResizeClassName = `transition-all duration-200`;

const useAnimateSidebar = (
  sidebarValue: RightSideBarType,
) => {
  const handleRef = useRef<ImperativePanelHandle>(null);
  const sidebarClosed = sidebarValue === RightSideBarType.NONE;
  useEffect(() => {
    const sidebarSize = handleRef.current?.getSize() ?? 0;
    if (sidebarClosed) {
      handleRef.current?.resize(0);
    } else if (sidebarSize === 0) {
      handleRef.current?.resize(25);
    }
  }, [handleRef, sidebarValue, sidebarClosed]);
  return handleRef;
};

const BuilderPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [setRun, flowVersion, rightSidebar, run, selectedStep] =
    useBuilderStateContext((state) => [
      state.setRun,
      state.flowVersion,
      state.rightSidebar,
      state.run,
      state.selectedStep,
    ]);

  useShowBuilderIsSavingWarningBeforeLeaving();

  const { memorizedSelectedStep } = useBuilderStateContext((state) => {
    const flowVersion = state.flowVersion;
    if (isNil(state.selectedStep) || isNil(flowVersion)) {
      return {
        memorizedSelectedStep: undefined,
      };
    }
    const step = flowStructureUtil.getStep(
      state.selectedStep,
      flowVersion.trigger,
    );

    return {
      memorizedSelectedStep: step,
    };
  });
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const middlePanelSize = useElementSize(middlePanelRef);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useAnimateSidebar(rightSidebar);
  const rightSidePanelRef = useRef<HTMLDivElement>(null);
  const { pieceModel, refetch: refetchPiece } =
    piecesHooks.usePieceModelForStepSettings({
      name: memorizedSelectedStep?.settings.pieceName,
      version: memorizedSelectedStep?.settings.pieceVersion,
      enabled:
        memorizedSelectedStep?.type === FlowActionType.PIECE ||
        memorizedSelectedStep?.type === FlowTriggerType.PIECE,
      getExactVersion: flowVersion.state === FlowVersionState.LOCKED,
    });
  const socket = useSocket();
  const { mutate: fetchAndUpdateRun } = useMutation({
    mutationFn: flowRunsApi.getPopulated,
  });
  useEffect(() => {
    socket.on(WebsocketClientEvent.REFRESH_PIECE, () => {
      refetchPiece();
    });
    socket.on(WebsocketClientEvent.FLOW_RUN_PROGRESS, (data) => {
      const runId = data?.runId;
      if (run && run?.id === runId) {
        fetchAndUpdateRun(runId, {
          onSuccess: (run) => {
            setRun(run, flowVersion);
            showRunStatusToast(run.status);
          },
        });
      }
    });
    return () => {
      socket.removeAllListeners(WebsocketClientEvent.REFRESH_PIECE);
      socket.removeAllListeners(WebsocketClientEvent.FLOW_RUN_PROGRESS);
    };
  }, [socket.id, run?.id]);

  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    useState(false);

  return (
    <div className="flex h-full w-full flex-col relative">
      <div className="z-50">
        <BuilderHeader />
      </div>
      <ResizablePanelGroup direction="horizontal">

        <ResizablePanel defaultSize={100} order={2} id="flow-canvas">
          <div ref={middlePanelRef} className="relative h-full w-full">
            <FlowCanvas
              setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
            ></FlowCanvas>

            <RunStatus
              run={run}
            />
            {middlePanelRef.current &&
              middlePanelRef.current.clientWidth > 0 && (
                <CanvasControls
                  canvasHeight={middlePanelRef.current?.clientHeight ?? 0}
                  canvasWidth={middlePanelRef.current?.clientWidth ?? 0}
                  hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                  selectedStep={selectedStep}
                ></CanvasControls>
              )}

            <ShowPoweredBy
              position="absolute"
              show={platform?.plan.showPoweredBy}
            />
            <DataSelector
              parentHeight={middlePanelSize.height}
              parentWidth={middlePanelSize.width}
            ></DataSelector>
          </div>
        </ResizablePanel>

        <ResizableHandle
          disabled={rightSidebar === RightSideBarType.NONE}
          withHandle={rightSidebar !== RightSideBarType.NONE}
          onDragging={setIsDraggingHandle}
          className={
            rightSidebar === RightSideBarType.NONE ? 'bg-transparent' : ''
          }
        />

        <ResizablePanel
          ref={rightHandleRef}
          id="right-sidebar"
          defaultSize={0}
          minSize={0}
          maxSize={60}
          order={3}
          className={cn('min-w-0 bg-background z-30', {
            [minWidthOfSidebar]: rightSidebar !== RightSideBarType.NONE,
            [animateResizeClassName]: !isDraggingHandle,
          })}
        >
          <div ref={rightSidePanelRef} className="h-full w-full">
            {rightSidebar === RightSideBarType.PIECE_SETTINGS &&
              memorizedSelectedStep && (
                <StepSettingsProvider
                  pieceModel={pieceModel}
                  selectedStep={memorizedSelectedStep}
                  key={constructContainerKey({
                    flowVersionId: flowVersion.id,
                    step: memorizedSelectedStep,
                    hasPieceModelLoaded: !!pieceModel,
                  })}
                >
                  <StepSettingsContainer />
                </StepSettingsProvider>
              )}
            {rightSidebar === RightSideBarType.RUNS && <RunsList />}
            {rightSidebar === RightSideBarType.VERSIONS && <FlowVersionsList />}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <ChatDrawer />
    </div>
  );
};

BuilderPage.displayName = 'BuilderPage';
export { BuilderPage };

function constructContainerKey({
  flowVersionId,
  step,
  hasPieceModelLoaded,
}: {
  flowVersionId: string;
  step?: FlowAction | FlowTrigger;
  hasPieceModelLoaded: boolean;
}) {
  const stepName = step?.name;
  const triggerOrActionName =
    step?.type === FlowTriggerType.PIECE
      ? step?.settings.triggerName
      : step?.settings.actionName;
  const pieceName =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step?.settings.pieceName
      : undefined;
  //we need to re-render the step settings form when the step is skipped, so when the user edits the settings after setting it to skipped the changes are reflected in the update request
  const isSkipped =
    step?.type != FlowTriggerType.EMPTY &&
    step?.type != FlowTriggerType.PIECE &&
    step?.skip;
  return `${flowVersionId}-${stepName ?? ''}-${triggerOrActionName ?? ''}-${
    pieceName ?? ''
  }-${'skipped-' + !!isSkipped}-${
    hasPieceModelLoaded ? 'loaded' : 'not-loaded'
  }`;
}

function showRunStatusToast(status: FlowRunStatus) {
  switch (status) {
    case FlowRunStatus.RUNNING:
      toast.info(t('Running')+'...')
      break;
    case FlowRunStatus.SUCCEEDED:
      toast.success(t('Run Succeeded'))
      break;
    case FlowRunStatus.FAILED:
    case FlowRunStatus.INTERNAL_ERROR:
    case FlowRunStatus.TIMEOUT:
      toast.error(t('Run Failed'))
      break;
    case FlowRunStatus.CANCELED:
      toast.error(t('Run Cancelled'))
      break;
    case FlowRunStatus.PAUSED:
      toast.info(t('Run Paused'))
      break;
    case FlowRunStatus.QUEUED:
      toast.info(t('Run Queued'))
  }
}