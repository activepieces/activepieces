import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';

import {
  LeftSideBarType,
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { FlowCanvas } from '@/app/builder/flow-canvas/flow-canvas';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { RunDetailsBar } from '@/features/flow-runs/components/run-details-bar';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { ActionType, PieceTrigger, TriggerType, flowHelper } from '@activepieces/shared';

import { cn } from '../../lib/utils';

import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesSelectorList } from './pieces-selector/piece-selector-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';
import { StepSettingsContainer } from './step-settings/step-settings-container';
import { ChatSidebar } from './ai-chat/chat-sidebar';

const minWidthOfSidebar = 'min-w-[max(20vw,400px)]';
const animateResizeClassName = `transition-all duration-200`;

const useAnimateSidebar = (
  sidebarValue: LeftSideBarType | RightSideBarType,
) => {
  const handleRef = useRef<ImperativePanelHandle>(null);
  const sidebarbarClosed = [
    LeftSideBarType.NONE,
    RightSideBarType.NONE,
  ].includes(sidebarValue);
  useEffect(() => {
    const sidebarSize = handleRef.current?.getSize() ?? 0;
    if (sidebarbarClosed) {
      handleRef.current?.resize(0);
    } else if (sidebarSize === 0) {
      handleRef.current?.resize(25);
    }
  }, [handleRef, sidebarValue, sidebarbarClosed]);
  return handleRef;
};

const constructContainerKey = (flowVersionId: string, stepName: string, triggerOrActionName?: string) => {
  return flowVersionId + stepName + (triggerOrActionName ?? '');
};
const BuilderPage = () => {
  const [
    leftSidebar,
    rightSidebar,
    flowVersion,
    exitRun,
    run,
    canExitRun,
  ] = useBuilderStateContext((state) => [
    state.leftSidebar,
    state.rightSidebar,
    state.flowVersion,
    state.exitRun,
    state.run,
    state.canExitRun,
  ]);

  const { memorizedSelectedStep, containerKey } = useBuilderStateContext((state) => {
    const stepPath = state.selectedStep
    const flowVerison = state.flowVersion
    if (!stepPath || !flowVerison) {
      return {
        memorizedSelectedStep: undefined,
        containerKey: undefined,
      };
    }
    const step = flowHelper.getStep(flowVerison, stepPath.stepName)
    const triggerOrActionName = step?.type === TriggerType.PIECE ? (step as PieceTrigger).settings.triggerName : step?.settings.actionName
    return {
      memorizedSelectedStep: flowHelper.getStep(flowVerison, stepPath.stepName),
      containerKey: constructContainerKey(flowVerison.id, stepPath.stepName, triggerOrActionName),
    }
  });

  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useAnimateSidebar(rightSidebar);
  const leftHandleRef = useAnimateSidebar(leftSidebar);


  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: memorizedSelectedStep?.settings.pieceName,
    version: memorizedSelectedStep?.settings.pieceVersion,
    enabled:
      memorizedSelectedStep?.type === ActionType.PIECE ||
      memorizedSelectedStep?.type === TriggerType.PIECE,
  });


  return (
    <div className="flex h-screen w-screen flex-col">
      {run && (
        <RunDetailsBar canExitRun={canExitRun} run={run} exitRun={exitRun} />
      )}
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal">
        <>
          <ResizablePanel
            id="left-sidebar"
            defaultSize={0}
            minSize={0}
            maxSize={45}
            order={1}
            ref={leftHandleRef}
            className={cn('min-w-0', {
              [minWidthOfSidebar]: leftSidebar !== LeftSideBarType.NONE,
              [animateResizeClassName]: !isDraggingHandle,
            })}
          >
            {leftSidebar === LeftSideBarType.RUNS && <FlowRecentRunsList />}
            {leftSidebar === LeftSideBarType.RUN_DETAILS && <FlowRunDetails />}
            {leftSidebar === LeftSideBarType.VERSIONS && <FlowVersionsList />}
            {leftSidebar === LeftSideBarType.CHAT && <ChatSidebar/>}
          </ResizablePanel>
          <ResizableHandle
            disabled={leftSidebar === LeftSideBarType.NONE}
            withHandle={leftSidebar !== LeftSideBarType.NONE}
            onDragging={setIsDraggingHandle}
          />
        </>

        <ResizablePanel defaultSize={100} order={2} id="flow-canvas">
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </ResizablePanel>

        <>
          <ResizableHandle
            disabled={rightSidebar === RightSideBarType.NONE}
            withHandle={rightSidebar !== RightSideBarType.NONE}
            onDragging={setIsDraggingHandle}
          />

          <ResizablePanel
            ref={rightHandleRef}
            id="right-sidebar"
            defaultSize={0}
            minSize={0}
            maxSize={60}
            order={3}
            className={cn('min-w-0', {
              [minWidthOfSidebar]: rightSidebar !== RightSideBarType.NONE,
              [animateResizeClassName]: !isDraggingHandle,
            })}
          >
            {rightSidebar === RightSideBarType.PIECE_SELECTOR && (
              <PiecesSelectorList />
            )}
            {rightSidebar === RightSideBarType.PIECE_SETTINGS &&
              memorizedSelectedStep &&
              !isPieceLoading && (
                <StepSettingsContainer
                  key={containerKey}
                  pieceModel={pieceModel}
                  selectedStep={memorizedSelectedStep}
                />
              )}
          </ResizablePanel>
        </>
      </ResizablePanelGroup>
    </div>
  );
};
BuilderPage.displayName = 'BuilderPage';
export { BuilderPage };
