import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';
import { FlowStepNode } from './nodes/step-node';
import { useBuilderStateContext } from '../builder-hooks';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { getLayoutedElements } from './layout';

const nodeTypes = {
  stepNode: FlowStepNode,
};

export const BuilderCanvas = React.memo(() => {
  const { theme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const { flowVersion } = useBuilderStateContext((state) => ({
    flowVersion: state.flowVersion,
  }));
  const {
    nodes: initialNodes,
    edges: initialEdges,
  } = flowCanvasUtils.convertFlowVersionToGraph(flowVersion.trigger);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Layout with ELK (async)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        await getLayoutedElements(initialNodes, initialEdges);
      if (mounted) {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNodes, setEdges, initialNodes, initialEdges]);

  return (
    <div className="size-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background
          gap={30}
          size={4}
          variant={BackgroundVariant.Dots}
          bgColor={theme === 'dark' ? '#1a1e23' : '#ffffff'}
          color={theme === 'dark' ? 'rgba(77, 77, 77, 0.45)' : '#F2F2F2'}
        />
      </ReactFlow>
    </div>
  );
});

BuilderCanvas.displayName = 'BuilderCanvas';

