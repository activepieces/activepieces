import { ReactFlowProvider } from '@xyflow/react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { BuilderNavBar } from '@/features/flow-canvas/components/builder-nav-bar';
import { FlowCanvas } from '@/features/flow-canvas/components/canvas';
import {
  LeftSideBarType,
  RightSideBarType,
  useBuilderStateContext,
} from '@/hooks/builder-hooks';

import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PieceSelectorList } from './piece-selector/piece-selector-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';

const BuilderPage = () => {
  const { flowVersion, leftSidebar, rightSidebar } = useBuilderStateContext(
    (state) => state,
  );

  return (
    <div className="flex h-screen w-screen flex-col">
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal">
        {leftSidebar !== LeftSideBarType.NONE && (
          <>
            <ResizablePanel
              id="left-sidebar"
              defaultSize={25}
              order={1}
              minSize={25}
              maxSize={40}
            >
              {leftSidebar === LeftSideBarType.RUNS && <FlowRecentRunsList />}
              {leftSidebar === LeftSideBarType.RUN_DETAILS && (
                <FlowRunDetails />
              )}
              {leftSidebar === LeftSideBarType.VERSIONS && <FlowVersionsList />}
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel defaultSize={100} order={2} id="flow-canvas">
          <ReactFlowProvider>
            <FlowCanvas flowVersion={flowVersion} />
          </ReactFlowProvider>
        </ResizablePanel>
        {rightSidebar !== RightSideBarType.NONE && (
          <>
            <ResizableHandle />

            <ResizablePanel
              id="right-sidebar"
              defaultSize={25}
              maxSize={40}
              minSize={25}
              order={3}
            >
              {rightSidebar === RightSideBarType.PIECE_SELECTOR && (
                <PieceSelectorList />
              )}
              {rightSidebar === RightSideBarType.PIECE_SETTINGS && (
                <div>Piece Settings</div>
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export { BuilderPage };
