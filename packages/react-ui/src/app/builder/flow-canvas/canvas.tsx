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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlowVersion } from '@activepieces/shared';
import {
  ApEdge,
  ApNode,
  flowCanvasUtils,
} from './flow-canvas-utils';
import { ApBigButton } from './nodes/big-button';
import { ApEdgeWithButton } from './edges/edge-with-button';
import { ApStepNode } from './nodes/step-node';
import { ReturnLoopedgeButton } from './edges/return-loop-edge';
import { LoopStepPlaceHolder } from './nodes/loop-step-placeholder';
import { StepPlaceHolder } from './nodes/step-holder-placeholder';

type FlowCanvasProps = {
  flowVersion: FlowVersion;
};

const FlowCanvas = ({ flowVersion }: FlowCanvasProps) => {
  const graph = useMemo(() => {
    return flowCanvasUtils.convertFlowVersionToGraph(flowVersion);
  }, [flowVersion]);

  const nodeTypes = useMemo(
    () => ({ stepNode: ApStepNode, placeholder: StepPlaceHolder, bigButton: ApBigButton, loopPlaceholder: LoopStepPlaceHolder }),
    [],
  );
  const edgeTypes = useMemo(() => ({ apEdge: ApEdgeWithButton, apReturnEdge: ReturnLoopedgeButton }), []);

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
    <div className="size-full grow">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        onEdgesChange={onEdgesChange}
        maxZoom={1.5}
        minZoom={0.5}
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
    </div>
  );
};

export { FlowCanvas };
