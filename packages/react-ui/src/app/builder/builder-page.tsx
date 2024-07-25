import { ReactFlowProvider } from '@xyflow/react';

import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesCardList } from './pieces-list/pieces-card-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';
import { StepSettings } from './step-settings/step-settings-container';

import {
  LeftSideBarType,
  RightSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { FlowCanvas } from '@/app/builder/flow-canvas/canvas';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { RunDetailsBar } from '@/features/flow-runs/components/run-details-bar';

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

  return (
    <div className="flex h-screen w-screen flex-col">
      {run && <RunDetailsBar run={run} onExitRun={ExitRun} />}
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal">
        {leftSidebar !== LeftSideBarType.NONE && (
          <>
            <ResizablePanel
              id="left-sidebar"
              defaultSize={25}
              order={1}
              minSize={25}
              maxSize={47}
            >
              {leftSidebar === LeftSideBarType.RUNS && <FlowRecentRunsList />}
              {leftSidebar === LeftSideBarType.RUN_DETAILS && (
                <FlowRunDetails />
              )}
              {leftSidebar === LeftSideBarType.VERSIONS && <FlowVersionsList />}
            </ResizablePanel>
            <ResizableHandle withHandle={true} />
          </>
        )}
        <ResizablePanel defaultSize={100} order={2} id="flow-canvas">
          <ReactFlowProvider>
            <FlowCanvas flowVersion={flowVersion} />
          </ReactFlowProvider>
        </ResizablePanel>
        {rightSidebar !== RightSideBarType.NONE && (
          <>
            <ResizableHandle withHandle={true} />

            <ResizablePanel
              id="right-sidebar"
              defaultSize={35}
              maxSize={60}
              minSize={30}
              order={3}
            >
              {rightSidebar === RightSideBarType.PIECE_SELECTOR && (
                <PiecesCardList />
              )}
              {rightSidebar === RightSideBarType.PIECE_SETTINGS && (
                <StepSettings key={flowVersion.id + selectedStep?.stepName} />
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export { BuilderPage };
