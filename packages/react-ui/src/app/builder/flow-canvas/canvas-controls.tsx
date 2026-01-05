import { Node, useKeyPress, useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Fullscreen, Hand, Map, Minus, MousePointer, Plus } from 'lucide-react';
import { useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { isMac } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import { flowCanvasConsts } from './utils/consts';
import { flowCanvasUtils } from './utils/flow-canvas-utils';
import { ApNode } from './utils/types';
const verticalPaddingOnFitView = 100;
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
  const { zoomIn, zoomOut, setViewport, getNodes, getNode, getViewport } =
    useReactFlow();
  const handleZoomIn = useCallback(() => {
    zoomIn({
      duration: 0,
    });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({
      duration: 0,
    });
  }, [zoomOut]);

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
        y: viewport.y - delta.y - flowCanvasConsts.AP_NODE_SIZE.STEP.height,
        zoom: viewport.zoom,
      });
    }
  };

  const [setPanningMode, panningMode, showMinimap, setShowMinimap] =
    useBuilderStateContext((state) => {
      return [
        state.setPanningMode,
        state.panningMode,
        state.showMinimap,
        state.setShowMinimap,
      ];
    });
  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const isInGrabMode =
    (spacePressed || panningMode === 'grab') && !shiftPressed;
  return (
    <div
      id="canvas-controls"
      className="z-50 absolute bottom-2 left-0 flex items-center  w-full pointer-events-none "
    >
      <div className="flex ml-2 items-center justify-center p-1.5 pointer-events-auto rounded-lg bg-background border border-sidebar-border">
        <CanvasButtonWrapper
          tooltip={t('Minimap' + (isMac() ? ' (⌘ + M)' : ' (Ctrl + M)'))}
        >
          <Button
            variant={showMinimap ? 'default' : 'ghost'}
            size="icon"
            onClick={() => {
              setShowMinimap(!showMinimap);
            }}
          >
            <Map className="size-4" />
          </Button>
        </CanvasButtonWrapper>
      </div>
      <div className="grow"></div>

      <div className="bg-background gap-2 flex items-center shadow-2xl justify-center border border-sidebar-border p-1.5 rounded-lg pointer-events-auto">
        <CanvasButtonWrapper tooltip={t('Zoom in')}>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <Plus className="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Zoom out')}>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <Minus className="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Fit to view')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleFitToView(false)}
          >
            <Fullscreen className="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <div>
          <Separator orientation="vertical" className="h-5"></Separator>
        </div>
        <CanvasButtonWrapper tooltip={t('Grab mode')}>
          <Button
            variant={isInGrabMode ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setPanningMode('grab')}
          >
            <Hand className="size-4" />
          </Button>
        </CanvasButtonWrapper>
        <CanvasButtonWrapper tooltip={t('Select mode')}>
          <Button
            variant={!isInGrabMode ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setPanningMode('pan')}
          >
            <MousePointer className="size-4" />
          </Button>
        </CanvasButtonWrapper>
      </div>
      <div className="grow"></div>
    </div>
  );
};

export { CanvasControls };

const CanvasButtonWrapper = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
