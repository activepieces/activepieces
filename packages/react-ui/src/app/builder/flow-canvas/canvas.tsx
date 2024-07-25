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

import { ApEdgeWithButton } from './edges/edge-with-button';
import { ReturnLoopedgeButton } from './edges/return-loop-edge';
import { ApEdge, ApNode, flowCanvasUtils } from './flow-canvas-utils';
import { ApBigButton } from './nodes/big-button';
import { LoopStepPlaceHolder } from './nodes/loop-step-placeholder';
import { StepPlaceHolder } from './nodes/step-holder-placeholder';
import { ApStepNode } from './nodes/step-node';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useBuilderStateContext } from '../builder-hooks';

type FlowCanvasProps = {
  flowVersion: FlowVersion;
};


const FlowCanvas = ({ flowVersion }: FlowCanvasProps) => {
  const graph = useMemo(() => {
    return flowCanvasUtils.convertFlowVersionToGraph(flowVersion);
  }, [flowVersion]);

  const [setActiveDraggingStep, activeDraggingStep, allowPanning] = useBuilderStateContext((state) => [state.setActiveDraggingStep, state.activeDraggingStep, state.allowPanning]);

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


  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor),
  );

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

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDraggingStep(e.active.id.toString())
  };

  const handleDragStartEnd = (e: DragEndEvent) => {
    setActiveDraggingStep(null)
  }


  return (
    <div className="size-full grow">
      <DndContext
        onDragStart={handleDragStart} onDragEnd={handleDragStartEnd} sensors={sensors}>
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          draggable={false}
          onEdgesChange={onEdgesChange}
          maxZoom={1.5}
          minZoom={0.5}
          panOnDrag={allowPanning}
          zoomOnDoubleClick={false}
          panOnScroll={true}
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
        <DragOverlay>
          <div>{activeDraggingStep}</div>
        </DragOverlay>
      </DndContext>

    </div>
  );
};

export { FlowCanvas };
