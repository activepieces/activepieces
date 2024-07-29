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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlowVersion } from '@activepieces/shared';

import { DataSelector } from '../data-selector/data-selector';

import { ApEdgeWithButton } from './edges/edge-with-button';
import { ReturnLoopedgeButton } from './edges/return-loop-edge';
import { ApEdge, ApNode, flowCanvasUtils } from './flow-canvas-utils';
import { ApBigButton } from './nodes/big-button';
import { LoopStepPlaceHolder } from './nodes/loop-step-placeholder';
import { StepPlaceHolder } from './nodes/step-holder-placeholder';
import { ApStepNode } from './nodes/step-node';

type FlowCanvasProps = {
  flowVersion: FlowVersion;
};

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

const FlowCanvas = ({ flowVersion }: FlowCanvasProps) => {
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
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        maxZoom={1.5}
        minZoom={0.5}
        zoomOnDoubleClick={false}
        fitView={true}
        nodesConnectable={false}
        elementsSelectable={true}
        nodesDraggable={false}
        fitViewOptions={{
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.2,
          duration: 0,
        }}
      >
        <Background />
        <Controls showInteractive={false} orientation="horizontal" />
      </ReactFlow>

      <DataSelector
        parentHeight={size.height}
        parentWidth={size.width}
      ></DataSelector>
    </div>
  );
};

export { FlowCanvas };
