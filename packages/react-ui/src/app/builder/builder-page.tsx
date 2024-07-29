import { ReactFlowProvider } from '@xyflow/react';

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

import { BuilderNavBar } from './builder-nav-bar';
import { FlowVersionsList } from './flow-versions/flow-versions-list';
import { PiecesCardList } from './pieces-list/pieces-card-list';
import { FlowRunDetails } from './run-details/flow-run-details-list';
import { FlowRecentRunsList } from './run-list/flow-runs-list';
import { StepSettingsContainer } from './step-settings/step-settings-container';
import React, { useEffect, useMemo, useState } from 'react';
import { flowHelper } from '../../../../shared/src';

const BuilderPage = React.memo(() => {
  const [leftSidebar, rightSidebar, flowVersion, selectedStep] =
    useBuilderStateContext((state) => [
      state.leftSidebar,
      state.rightSidebar,
      state.flowVersion,
      state.selectedStep,
    ]);

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
      <RunDetailsBar />
      <BuilderNavBar />
      <ResizablePanelGroup direction="horizontal">
        {leftSidebar !== LeftSideBarType.NONE && (
          <>
            <ResizablePanel
              key={'left-sidebar'}
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
            <FlowCanvas />
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
              {rightSidebar === RightSideBarType.PIECE_SETTINGS && memorizedSelectedStep && (
                <StepSettingsContainer key={containerKey} selectedStep={memorizedSelectedStep} />
              )}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
});

export { BuilderPage };
