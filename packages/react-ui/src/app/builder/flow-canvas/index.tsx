import { ReactFlow, Background, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';
import { usePrevious } from 'react-use';

import { isFlowStateTerminal } from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../builder-hooks';

import { flowCanvasUtils } from './flow-canvas-utils';
import { FlowDragLayer } from './flow-drag-layer';

import { AboveFlowWidgets } from './widgets';
import { newFloWUtils } from './new/new-utils';
import { flowUtilConsts } from './new/consts';

const FlowCanvas = React.memo(() => {
  const [allowCanvasPanning, graph, run] = useBuilderStateContext((state) => {
    const graph = newFloWUtils.convertFlowVersionToGraph(state.flowVersion);
    return [state.allowCanvasPanning, graph, state.run];
  });
  const previousRun = usePrevious(run);
  const { fitView } = useReactFlow();
  if (
    (run && previousRun?.id !== run.id && isFlowStateTerminal(run.status)) ||
    (run &&
      previousRun &&
      !isFlowStateTerminal(previousRun.status) &&
      isFlowStateTerminal(run.status))
  ) {
    const failedStep = run.steps
      ? flowRunUtils.findFailedStepInOutput(run.steps)
      : null;
    if (failedStep) {
      setTimeout(() => {
        fitView(flowCanvasUtils.createFocusStepInGraphParams(failedStep));
      });
    }
  }

  return (
    <div className="size-full relative overflow-hidden">
      <FlowDragLayer>
        <ReactFlow
          nodeTypes={flowUtilConsts.nodeTypes}
          nodes={graph.nodes}
          edgeTypes={flowUtilConsts.edgeTypes}
          edges={graph.edges}
          draggable={false}
          edgesFocusable={false}
          elevateEdgesOnSelect={false}
          maxZoom={1.5}
          minZoom={0.5}
          panOnDrag={allowCanvasPanning}
          zoomOnDoubleClick={false}
          panOnScroll={true}
          fitView={true}
          nodesConnectable={false}
          elementsSelectable={true}
          nodesDraggable={false}
          nodesFocusable={false}
          fitViewOptions={{
            includeHiddenNodes: false,
            minZoom: 0.5,
            maxZoom: 1.2,
            nodes: graph.nodes.slice(0, 5),
            duration: 0,
          }}
        >
          <AboveFlowWidgets></AboveFlowWidgets>
          <Background />
        </ReactFlow>
      </FlowDragLayer>
    </div>
  );
});

FlowCanvas.displayName = 'FlowCanvas';
export { FlowCanvas };
