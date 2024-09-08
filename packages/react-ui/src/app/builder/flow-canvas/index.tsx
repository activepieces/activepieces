import { ReactFlow, Background, getNodesBounds } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import { useBuilderStateContext } from '../builder-hooks';

import { ApEdgeWithButton } from './edges/edge-with-button';
import { ReturnLoopedgeButton } from './edges/return-loop-edge';
import { flowCanvasUtils } from './flow-canvas-utils';
import { FlowDragLayer } from './flow-drag-layer';
import { ApBigButton } from './nodes/big-button';
import { LoopStepPlaceHolder } from './nodes/loop-step-placeholder';
import { StepPlaceHolder } from './nodes/step-holder-placeholder';
import { ApStepNode } from './nodes/step-node';
import { AboveFlowWidgets, BelowFlowWidget } from './widgets';
const edgeTypes = {
  apEdge: ApEdgeWithButton,
  apReturnEdge: ReturnLoopedgeButton,
};
const nodeTypes = {
  stepNode: ApStepNode,
  placeholder: StepPlaceHolder,
  bigButton: ApBigButton,
  loopPlaceholder: LoopStepPlaceHolder,
};
const FlowCanvas = React.memo(() => {
  const [allowCanvasPanning, graph, graphHeight] = useBuilderStateContext(
    (state) => {
      const graph = flowCanvasUtils.convertFlowVersionToGraph(
        state.flowVersion,
      );
      return [state.allowCanvasPanning, graph, getNodesBounds(graph.nodes)];
    },
  );

  return (
    <div className="size-full relative overflow-hidden">
      <FlowDragLayer>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={graph.nodes}
          edgeTypes={edgeTypes}
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

          <BelowFlowWidget graphHeight={graphHeight.height}></BelowFlowWidget>
        </ReactFlow>
      </FlowDragLayer>
    </div>
  );
});

FlowCanvas.displayName = 'FlowCanvas';
export { FlowCanvas };
