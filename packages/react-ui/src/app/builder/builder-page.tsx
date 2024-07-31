import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { cn } from '../../lib/utils';
import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesCardList } from './pieces-list/pieces-card-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';
import { StepSettings } from './step-settings/step-settings-container';

const minWidthOfSidebar = 'min-w-[max(20vw,400px)]';
const useAnimateSidebar = (
  sidebarValue: LeftSideBarType | RightSideBarType,
) => {
  const handleRef = useRef<ImperativePanelHandle>(null);
  const sidebarbarClosed = [LeftSideBarType.NONE, RightSideBarType.NONE].includes(sidebarValue);
  useEffect(() => {
    const sidebarSize = handleRef.current?.getSize() ?? 0;
    if (sidebarbarClosed) {
      handleRef.current?.resize(0);
    } else if (sidebarSize === 0){
      handleRef.current?.resize(25);
    }
  }, [handleRef, sidebarValue]);
  return handleRef;
};
const animateResizeClassName = `transition-all duration-200`;
const BuilderPage = () => {
  const [flowVersion, leftSidebar, rightSidebar, run, ExitRun, selectedStep] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.leftSidebar,
      state.rightSidebar,
      state.run,
      state.ExitRun,
      state.selectedStep,
    ]);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useAnimateSidebar(
    useCallback(() => rightSidebar === RightSideBarType.NONE, [rightSidebar]),
    rightSidebar,
  );
  const leftHandleRef = useAnimateSidebar(
    useCallback(() => leftSidebar === LeftSideBarType.NONE, [leftSidebar]),
    leftSidebar,
  );
  return (
    <div className="flex h-screen w-screen flex-col">
      {run && <RunDetailsBar run={run} onExitRun={ExitRun} />}
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
            maxSize={45}
            order={3}
            className={cn('min-w-0', {
              [minWidthOfSidebar]: rightSidebar !== RightSideBarType.NONE,
              [animateResizeClassName]: !isDraggingHandle,
            })}
          >
            {rightSidebar === RightSideBarType.PIECE_SELECTOR && (
              <PiecesCardList />
            )}
            {rightSidebar === RightSideBarType.PIECE_SETTINGS && (
              <StepSettings key={flowVersion.id + selectedStep?.stepName} />
            )}
          </ResizablePanel>
        </>
      </ResizablePanelGroup>
    </div>
  );
};

export { BuilderPage };
