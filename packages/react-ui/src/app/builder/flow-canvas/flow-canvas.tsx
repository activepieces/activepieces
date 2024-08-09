import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  EdgeChange,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useBuilderStateContext } from '../builder-hooks';
import { DataSelector } from '../data-selector/data-selector';

import { ApEdgeWithButton } from './edges/edge-with-button';
import { ReturnLoopedgeButton } from './edges/return-loop-edge';
import { ApEdge, ApNode, flowCanvasUtils } from './flow-canvas-utils';
import { FlowDragLayer } from './flow-drag-layer';
import { ApBigButton } from './nodes/big-button';
import { LoopStepPlaceHolder } from './nodes/loop-step-placeholder';
import { StepPlaceHolder } from './nodes/step-holder-placeholder';
import { ApStepNode } from './nodes/step-node';
import { TestFlowWidget } from './test-flow-widget';

function useContainerSize(
  setSize: (size: { width: number; height: number }) => void,
  containerRef: React.RefObject<HTMLDivElement>,
) {
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, setSize]);
}
const FlowCanvas = React.memo(() => {
  const [allowCanvasPanning, flowVersion] = useBuilderStateContext((state) => [
    state.allowCanvasPanning,
    state.flowVersion,
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => {
    return flowCanvasUtils.convertFlowVersionToGraph(flowVersion);
  }, [flowVersion]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useContainerSize(setSize, containerRef);

  const nodeTypes = useMemo(
    () => ({
      stepNode: ApStepNode,
      placeholder: StepPlaceHolder,
      bigButton: ApBigButton,
      loopPlaceholder: LoopStepPlaceHolder,
    }),
    [],
  );
  const edgeTypes = useMemo(
    () => ({ apEdge: ApEdgeWithButton, apReturnEdge: ReturnLoopedgeButton }),
    [],
  );

  const [nodes, setNodes] = useState(graph.nodes);
  const [edges, setEdges] = useState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ApNode>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<ApEdge>[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  return (
    <div className="size-full grow relative" ref={containerRef}>
      <FlowDragLayer>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          draggable={false}
          edgesFocusable={false}
          elevateEdgesOnSelect={false}
          onEdgesChange={onEdgesChange}
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
            nodes: nodes.slice(0, 5),
            duration: 0,
          }}
        >
          <TestFlowWidget></TestFlowWidget>
          <Background />
          <Controls showInteractive={false} orientation="horizontal" />
        </ReactFlow>
      </FlowDragLayer>
      <DataSelector
        parentHeight={size.height}
        parentWidth={size.width}
      ></DataSelector>
    </div>
  );
});
FlowCanvas.displayName = 'FlowCanvas';
export { FlowCanvas };
