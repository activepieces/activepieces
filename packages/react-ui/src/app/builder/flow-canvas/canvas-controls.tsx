import { Node, useKeyPress, useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import {
  Fullscreen,
  Hand,
  Minus,
  MousePointer,
  Plus,
  Redo,
  Undo,
  RotateCw,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { useBuilderStateContext, useTemporalStateContext } from '../builder-hooks';

import { flowUtilConsts } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { ApNode } from './utils/types';
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

const PanningModeIndicator = ({ toggled }: { toggled: boolean }) => {
  return (
    <div
      className={cn(
        'absolute transition-all bg-primary/15 w-full h-full top-0 left-0',
        {
          'opacity-0': !toggled,
        },
      )}
    ></div>
  );
};

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

  const { undo, redo, canRedo, canUndo } = useTemporalStateContext(state => state)
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

  const [setPanningMode, panningMode] = useBuilderStateContext((state) => {
    return [state.setPanningMode, state.panningMode];
  });
  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const isInGrabMode =
    (spacePressed || panningMode === 'grab') && !shiftPressed;

  return (
    <>
      <div className="bg-accent absolute left-[10px] bottom-[60px] z-50 flex flex-col gap-2 shadow-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                if (!spacePressed) {
                  setPanningMode('pan');
                }
              }}
              className="relative focus:outline-0"
            >
              <PanningModeIndicator toggled={!isInGrabMode} />
              <MousePointer className="size-5"></MousePointer>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Select Mode')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                if (!spacePressed) {
                  setPanningMode('grab');
                }
              }}
              className="relative focus:outline-0"
            >
              <PanningModeIndicator toggled={isInGrabMode} />

              <Hand className="size-5"></Hand>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Move Mode')}</TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-accent absolute left-[10px] bottom-[10px] z-50 flex flex-row shadow-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="accent" size="sm" onClick={handleZoomReset}>
              <RotateCw className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Reset Zoom')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="accent" size="sm" onClick={handleZoomIn}>
              <Plus className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Zoom In')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="accent" size="sm" onClick={handleZoomOut}>
              <Minus className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Zoom Out')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="accent"
              size="sm"
              onClick={() => handleFitToView(false)}
            >
              <Fullscreen className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Fit to View')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!canUndo}
              variant="accent"
              size="sm"
              onClick={() => undo()}
            >
              <Undo className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Undo')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              disabled={!canRedo}
              variant="accent"
              size="sm"
              onClick={() => redo()}
            >
              <Redo className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('Redo')}</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
};

export { CanvasControls };
