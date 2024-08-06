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
import { ActionType, TriggerType, flowHelper } from '@activepieces/shared';

import { cn } from '../../lib/utils';

import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesSelectorList } from './pieces-selector/piece-selector-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';
import { StepSettingsContainer } from './step-settings/step-settings-container';

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

const BuilderPage = () => {
  const [leftSidebar, rightSidebar, flowVersion, selectedStep, exitRun, run] =
    useBuilderStateContext((state) => [
      state.leftSidebar,
      state.rightSidebar,
      state.flowVersion,
      state.selectedStep,
      state.exitRun,
      state.run,
    ]);

  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useAnimateSidebar(rightSidebar);
  const leftHandleRef = useAnimateSidebar(leftSidebar);

  const [containerKey, setContainerKey] = useState<string | undefined>(
    undefined,
  );

  const memorizedSelectedStep = useMemo(() => {
    if (!flowVersion || !selectedStep?.stepName) {
      return undefined;
    }
    return flowHelper.getStep(flowVersion, selectedStep.stepName);
  }, [flowVersion.id, selectedStep]);

  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: memorizedSelectedStep?.settings.pieceName,
    version: memorizedSelectedStep?.settings.pieceVersion,
    enabled:
      memorizedSelectedStep?.type === ActionType.PIECE ||
      memorizedSelectedStep?.type === TriggerType.PIECE,
  });

  useEffect(() => {
    if (!selectedStep) {
      return;
    }
    setContainerKey(flowVersion.id + selectedStep.stepName);
  }, [selectedStep, flowVersion]);

  return (
    <div className="flex h-screen w-screen flex-col">
      {run && <RunDetailsBar run={run} exitRun={exitRun} />}
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
