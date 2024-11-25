import { Node, useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Fullscreen, Minus, Plus, RotateCw } from 'lucide-react';
import { useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { flowUtilConsts } from './consts';
import { flowCanvasUtils } from './flow-canvas-utils';
import { ApNode } from './types';
const verticalPaddingOnFitView = 100;
const duration = 500;
// Calculate the node's position in relation to the canvas
const calculateNodePositionInCanvas = (
  canvasWidth: number,
  node: Node,
  zoom: number,
) => ({
  x:
    node.position.x +
    canvasWidth / 2 -
    (flowUtilConsts.AP_NODE_SIZE.STEP.width * zoom) / 2,
  y:
    node.position.y +
    flowUtilConsts.AP_NODE_SIZE.GRAPH_END_WIDGET.height +
    verticalPaddingOnFitView * zoom,
});

// Check if the node is out of view
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
          flowUtilConsts.AP_NODE_SIZE.STEP.width * 2)
      : nodePosition.x < 0
      ? -1 * nodePosition.x
      : 0,
  y:
    nodePosition.y > canvas.height
      ? nodePosition.y - canvas.height + flowUtilConsts.AP_NODE_SIZE.STEP.height
      : 0,
});

const CanvasControls = ({
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
  const {
    zoomIn,
    zoomOut,
    zoomTo,
    setViewport,
    getNodes,
    getNode,
    getViewport,
  } = useReactFlow();
  const handleZoomIn = useCallback(() => {
    zoomIn({
      duration,
    });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({
      duration,
    });
  }, [zoomOut]);

  const handleZoomReset = useCallback(() => {
    zoomTo(1, { duration });
  }, [zoomTo]);

  const handleFitToView = useCallback(
    (isInitialRenderCall: boolean) => {
      const nodes = getNodes();
      if (nodes.length === 0) return;
      const graphHeight = flowCanvasUtils.calculateGraphBoundingBox({
        nodes: nodes as ApNode[],
        edges: [],
      }).height;
      const zoomRatio = Math.min(
        Math.max(canvasHeight / graphHeight, 0.9),
        1.25,
      );

      setViewport(
        {
          x:
            canvasWidth / 2 -
            (flowUtilConsts.AP_NODE_SIZE.STEP.width * zoomRatio) / 2,
          y: nodes[0].position.y + verticalPaddingOnFitView * zoomRatio,
          zoom: zoomRatio,
        },
        {
          duration: isInitialRenderCall ? 0 : duration,
        },
      );
    },
    [getNodes, canvasHeight, setViewport, canvasWidth],
  );

  useEffect(() => {
    if (!hasCanvasBeenInitialised) return;

    handleFitToView(true);

    if (selectedStep) {
      adjustViewportForSelectedStep(selectedStep);
    }
  }, [hasCanvasBeenInitialised]);

  // Helper function to adjust the viewport for the selected step
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
        y: viewport.y - delta.y - flowUtilConsts.AP_NODE_SIZE.STEP.height,
        zoom: viewport.zoom,
      });
    }
  };

  return (
    <div className="bg-secondary absolute left-[10px] bottom-[10px] z-50 flex flex-row">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomReset}>
            <RotateCw className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Reset Zoom')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomIn}>
            <Plus className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Zoom In')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" onClick={handleZoomOut}>
            <Minus className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Zoom Out')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFitToView(false)}
          >
            <Fullscreen className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t('Fit to View')}</TooltipContent>
      </Tooltip>
    </div>
  );
};

export { CanvasControls };
