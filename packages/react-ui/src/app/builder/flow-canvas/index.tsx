import { ReactFlow, Background, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useEffect, useRef } from 'react';
import { usePrevious } from 'react-use';

import { isFlowStateTerminal } from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../builder-hooks';

import { flowUtilConsts } from './consts';
import { flowCanvasUtils } from './flow-canvas-utils';
import { FlowDragLayer } from './flow-drag-layer';
import { AboveFlowWidgets } from './widgets';

export const FlowCanvas = React.memo(
  ({
    setHasCanvasBeenInitialised,
    lefSideBarContainerWidth,
  }: {
    setHasCanvasBeenInitialised: (value: boolean) => void;
    lefSideBarContainerWidth: number;
  }) => {
    const [allowCanvasPanning, graph, run] = useBuilderStateContext((state) => {
      const graph = flowCanvasUtils.convertFlowVersionToGraph(
        state.flowVersion,
      );
      return [state.allowCanvasPanning, graph, state.run];
    });

    const previousRun = usePrevious(run);
    const { fitView, getViewport, setViewport } = useReactFlow();
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
    const containerRef = useRef<HTMLDivElement>(null);
    const containerSizeRef = useRef({
      width: 0,
      height: 0,
    });
    useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;

        setHasCanvasBeenInitialised(true);
        const { x, y, zoom } = getViewport();

        if (containerRef.current && width !== containerSizeRef.current.width) {
          const newX = x + (width - containerSizeRef.current.width) / 2;
          // Update the viewport to keep content centered without affecting zoom
          setViewport({ x: newX, y, zoom });
        }
        // Adjust x/y values based on the new size and keep the same zoom level

        containerSizeRef.current = {
          width,
          height,
        };
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [setViewport, getViewport]);

    return (
      <div
        ref={containerRef}
        className="size-full relative overflow-hidden z-50"
      >
        <FlowDragLayer lefSideBarContainerWidth={lefSideBarContainerWidth}>
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
            fitView={false}
            nodesConnectable={false}
            elementsSelectable={true}
            nodesDraggable={false}
            nodesFocusable={false}
          >
            <AboveFlowWidgets></AboveFlowWidgets>
            <Background />
          </ReactFlow>
        </FlowDragLayer>
      </div>
    );
  },
);

FlowCanvas.displayName = 'FlowCanvas';
