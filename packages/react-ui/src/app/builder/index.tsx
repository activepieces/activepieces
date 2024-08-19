import {
  ActionType,
  PieceTrigger,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';

import { cn, useElementSize } from '../../lib/utils';

import { BuilderNavBar } from './builder-nav-bar';
import { ChatSidebar } from './copilot';
import { FlowCanvas } from './flow-canvas';
import { FlowVersionsList } from './flow-versions';
import { PiecesSelectorList } from './pieces-selector';
import { FlowRunDetails } from './run-details';
import { FlowRecentRunsList } from './run-list';
import { StepSettingsContainer } from './step-settings';

import {
  LeftSideBarType,
  RightSideBarType,
  useBuilderStateContext,
  useSwitchToDraft,
} from '@/app/builder/builder-hooks';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { RunDetailsBar } from '@/features/flow-runs/components/run-details-bar';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';

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

const constructContainerKey = (
  flowVersionId: string,
  stepName: string,
  triggerOrActionName?: string,
) => {
  return flowVersionId + stepName + (triggerOrActionName ?? '');
};
const BuilderPage = () => {
  const [leftSidebar, rightSidebar, run, canExitRun] = useBuilderStateContext(
    (state) => [
      state.leftSidebar,
      state.rightSidebar,
      state.run,
      state.canExitRun,
    ],
  );

  const { memorizedSelectedStep, containerKey } = useBuilderStateContext(
    (state) => {
      const stepPath = state.selectedStep;
      const flowVersion = state.flowVersion;
      if (!stepPath || !flowVersion) {
        return {
          memorizedSelectedStep: undefined,
          containerKey: undefined,
        };
      }
      const step = flowHelper.getStep(flowVersion, stepPath.stepName);
      const triggerOrActionName =
        step?.type === TriggerType.PIECE
          ? (step as PieceTrigger).settings.triggerName
          : step?.settings.actionName;
      return {
        memorizedSelectedStep: step,
        containerKey: constructContainerKey(
          flowVersion.id,
          stepPath.stepName,
          triggerOrActionName,
        ),
      };
    },
  );

  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const rightHandleRef = useAnimateSidebar(rightSidebar);
  const leftHandleRef = useAnimateSidebar(leftSidebar);
  const builderNavBarContainer = useRef<HTMLDivElement>(null);
  const {height:builderNavbarHeight} = useElementSize(builderNavBarContainer);
  const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
    name: memorizedSelectedStep?.settings.pieceName,
    version: memorizedSelectedStep?.settings.pieceVersion,
    enabled:
      memorizedSelectedStep?.type === ActionType.PIECE ||
      memorizedSelectedStep?.type === TriggerType.PIECE,
  });

  const { switchToDraft, isSwitchingToDraftPending } = useSwitchToDraft();

  return (
    <div className="flex h-screen w-screen flex-col relative">
      {run && (
        <RunDetailsBar
          canExitRun={canExitRun}
          run={run}
          isLoading={isSwitchingToDraftPending}
          exitRun={switchToDraft}
        />
      )}
      <div ref={builderNavBarContainer}>
      <BuilderNavBar />

      </div>
      <ReactFlowProvider>
      <div className='absolute left-0 top-0 h-full w-full z-10 '
      style={{paddingTop:`${builderNavbarHeight}px`}}>
            <FlowCanvas />
      </div>
      <ResizablePanelGroup direction="horizontal">
        <>
          <ResizablePanel
            id="left-sidebar"
            defaultSize={0}
            minSize={0}
            maxSize={39}
            order={1}
            ref={leftHandleRef}
            className={cn('min-w-0 bg-background z-20', {
              [minWidthOfSidebar]: leftSidebar !== LeftSideBarType.NONE,
              [animateResizeClassName]: !isDraggingHandle,
            })}
          >
             

            {leftSidebar === LeftSideBarType.RUNS && <FlowRecentRunsList />}
            {leftSidebar === LeftSideBarType.RUN_DETAILS && <FlowRunDetails />}
            {leftSidebar === LeftSideBarType.VERSIONS && <FlowVersionsList />}
            {leftSidebar === LeftSideBarType.AI_COPILOT && <ChatSidebar />}
          </ResizablePanel>
          <ResizableHandle
            disabled={leftSidebar === LeftSideBarType.NONE}
            withHandle={leftSidebar !== LeftSideBarType.NONE}
            onDragging={setIsDraggingHandle}
                className='z-20'
          />
        </>

        <ResizablePanel defaultSize={100} order={2} id="flow-canvas">
          <div className='relative h-full w-full'>
          <CanvasControls></CanvasControls>
          </div>
        </ResizablePanel>

        <>
          <ResizableHandle
            disabled={rightSidebar === RightSideBarType.NONE}
            withHandle={rightSidebar !== RightSideBarType.NONE}
            onDragging={setIsDraggingHandle}
            className='z-30'
          />

          <ResizablePanel
            ref={rightHandleRef}
            id="right-sidebar"
            defaultSize={0}
            minSize={0}
            maxSize={60}
            order={3}
            className={cn('min-w-0 bg-background z-20', {
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
    </ReactFlowProvider>

    </div>
  );
};

BuilderPage.displayName = 'BuilderPage';
export { BuilderPage };
