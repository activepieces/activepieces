import { Node, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApNode, CanvasOrientation } from '../utils/types';

const verticalPaddingOnFitView = 100;

const useFitToView = ({
  canvasWidth,
  canvasHeight,
  hasCanvasBeenInitialised,
  selectedStep,
}: {
  canvasWidth: number;
  canvasHeight: number;
  hasCanvasBeenInitialised: boolean;
  selectedStep: string | null;
}) => {
  const { setViewport, getNodes, getNode, getViewport } = useReactFlow();
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );

  const handleFitToView = useCallback(
    ({
      isInitialRenderCall,
      orientation,
    }: {
      isInitialRenderCall: boolean;
      orientation?: CanvasOrientation;
    }) => {
      const effectiveOrientation = orientation ?? canvasOrientation;
      const nodes = getNodes();
      if (nodes.length === 0) return;
      if (effectiveOrientation === 'horizontal') {
        const stepNodeSize = flowCanvasConsts.STEP_NODE_SIZE.horizontal;
        const minX = Math.min(...nodes.map((node) => node.position.x));
        const maxX = Math.max(...nodes.map((node) => node.position.x));
        const minY = Math.min(...nodes.map((node) => node.position.y));
        const maxY =
          Math.max(...nodes.map((node) => node.position.y)) +
          stepNodeSize.height;
        const graphWidth = Math.max(maxX - minX, stepNodeSize.width);
        const graphHeight = Math.max(maxY - minY, stepNodeSize.height);
        const zoomRatio = Math.min(
          Math.max(
            Math.min(canvasWidth / graphWidth, canvasHeight / graphHeight),
            0.9,
          ),
          1.25,
        );
        setViewport(
          {
            x:
              -minX * zoomRatio +
              verticalPaddingOnFitView * zoomRatio +
              stepNodeSize.width,
            y: canvasHeight / 2 - ((minY + maxY) / 2) * zoomRatio,
            zoom: zoomRatio,
          },
          {
            duration: isInitialRenderCall ? 0 : 500,
          },
        );
        return;
      }
      const graphHeight = flowCanvasUtils.calculateGraphBoundingBox({
        graph: {
          nodes: nodes as ApNode[],
          edges: [],
        },
        orientation: effectiveOrientation,
      }).height;
      const zoomRatio = Math.min(
        Math.max(canvasHeight / graphHeight, 0.9),
        1.25,
      );

      setViewport(
        {
          x:
            canvasWidth / 2 -
            (flowCanvasConsts.AP_NODE_SIZE.STEP.width * zoomRatio) / 2,
          y:
            nodes[0].position.y +
            verticalPaddingOnFitView * zoomRatio +
            flowCanvasConsts.AP_NODE_SIZE.STEP.height,
          zoom: zoomRatio,
        },
        {
          duration: isInitialRenderCall ? 0 : 500,
        },
      );
    },
    [getNodes, canvasHeight, setViewport, canvasWidth, canvasOrientation],
  );

  const adjustViewportForSelectedStep = (stepId: string) => {
    const node = getNode(stepId);
    if (!node) return;

    const viewport = getViewport();

    const canvas = {
      height: canvasHeight / viewport.zoom,
      width: canvasWidth / viewport.zoom,
    };

    const nodePositionInRelationToCanvas = calculateNodePositionInCanvas(
      canvasWidth,
      node,
      viewport.zoom,
    );

    if (isNodeOutOfView(nodePositionInRelationToCanvas, canvas)) {
      const delta = calculateViewportDelta(
        nodePositionInRelationToCanvas,
        canvas,
      );

      setViewport({
        x: viewport.x + delta.x,
        y: viewport.y - delta.y - flowCanvasConsts.AP_NODE_SIZE.STEP.height,
        zoom: viewport.zoom,
      });
    }
  };

  useEffect(() => {
    if (!hasCanvasBeenInitialised) return;

    handleFitToView({ isInitialRenderCall: true });

    if (selectedStep) {
      adjustViewportForSelectedStep(selectedStep);
    }
  }, [hasCanvasBeenInitialised]);

  return { handleFitToView };
};

const calculateNodePositionInCanvas = (
  canvasWidth: number,
  node: Node,
  zoom: number,
) => ({
  x:
    node.position.x +
    canvasWidth / 2 -
    (flowCanvasConsts.AP_NODE_SIZE.STEP.width * zoom) / 2,
  y:
    node.position.y +
    flowCanvasConsts.AP_NODE_SIZE.GRAPH_END_WIDGET.height +
    verticalPaddingOnFitView * zoom,
});

const isNodeOutOfView = (
  nodePosition: { x: number; y: number },
  canvas: { width: number; height: number },
) =>
  nodePosition.y > canvas.height ||
  nodePosition.x > canvas.width ||
  nodePosition.x < 0;

const calculateViewportDelta = (
  nodePosition: { x: number; y: number },
  canvas: { width: number; height: number },
) => ({
  x:
    nodePosition.x > canvas.width
      ? -1 *
        (nodePosition.x -
          canvas.width +
          flowCanvasConsts.AP_NODE_SIZE.STEP.width * 2)
      : nodePosition.x < 0
      ? -1 * nodePosition.x
      : 0,
  y:
    nodePosition.y > canvas.height
      ? nodePosition.y -
        canvas.height +
        flowCanvasConsts.AP_NODE_SIZE.STEP.height
      : 0,
});

export { useFitToView };
