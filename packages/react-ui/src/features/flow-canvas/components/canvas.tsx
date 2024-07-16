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
import { useCallback, useMemo, useState } from 'react';

import { PopulatedFlow } from '@activepieces/shared';

import { ApEdge, ApNode, flowCanvasUtils } from '../lib/flow-canvas-utils';

import { ApBigButton } from './big-button';
import { ApEdgeWithButton } from './edge-with-button';
import { ApStepNode } from './step-node';

type FlowCanvasProps = {
  flow: PopulatedFlow;
};

const FlowCanvas = ({ flow }: FlowCanvasProps) => {
  const graph = useMemo(() => {
    return flowCanvasUtils.convertFlowVersionToGraph(flow.version);
  }, [flow.version]);

  const nodeTypes = useMemo(
    () => ({ stepNode: ApStepNode, bigButtonNode: ApBigButton }),
    [],
  );
  const edgeTypes = useMemo(() => ({ apEdge: ApEdgeWithButton }), []);

  const [nodes, setNodes] = useState(graph.nodes);
  const [edges, setEdges] = useState(graph.edges);

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
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export { FlowCanvas };
