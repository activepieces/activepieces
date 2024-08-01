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
import { flowHelper } from '@activepieces/shared';

import { cn } from '../../lib/utils';

import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesCardList } from './pieces-list/pieces-card-list';
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
              <PiecesCardList />
            )}
            {rightSidebar === RightSideBarType.PIECE_SETTINGS &&
              memorizedSelectedStep && (
                <StepSettingsContainer
                  key={containerKey}
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
