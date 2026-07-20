import { Viewport, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect } from 'react';

import {
  StageTier,
  useStageOptional,
} from '@/app/components/workspace-shell/stage-context';
import { STAGE_TRANSITION_MS, easeStageTransition } from '@/lib/ui-transitions';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApNode, CanvasOrientation } from '../utils/types';

const verticalPaddingOnFitView = 100;
const horizontalPaddingOnFitView = 40;

// Zoom-out floor per Stage tier (ReactFlow minZoom 0.4 sits just below the lowest).
function fitZoomFloorForTier(tier: StageTier): number {
  switch (tier) {
    case 'mini':
      return 0.45;
    case 'narrow':
      return 0.5;
    default:
      return 0.6;
  }
}

// Pure fit math: where the viewport lands to centre the whole flow in the canvas.
// Shared by handleFitToView and the editor-toggle settle so both agree.
function computeFitViewport({
  nodes,
  canvasWidth,
  canvasHeight,
  orientation,
  zoomFloor,
}: {
  nodes: ApNode[];
  canvasWidth: number;
  canvasHeight: number;
  orientation: CanvasOrientation;
  zoomFloor: number;
}): Viewport | null {
  if (nodes.length === 0) return null;
  if (orientation === 'horizontal') {
    const stepNodeSize = flowCanvasConsts.STEP_NODE_SIZE.horizontal;
    const minX = Math.min(...nodes.map((node) => node.position.x));
    const maxX = Math.max(...nodes.map((node) => node.position.x));
    const minY = Math.min(...nodes.map((node) => node.position.y));
    const maxY =
      Math.max(...nodes.map((node) => node.position.y)) + stepNodeSize.height;
    const graphWidth = Math.max(maxX - minX, stepNodeSize.width);
    const graphHeight = Math.max(maxY - minY, stepNodeSize.height);
    const zoomRatio = Math.min(
      Math.max(
        Math.min(canvasWidth / graphWidth, canvasHeight / graphHeight),
        0.9,
      ),
      1.25,
    );
    return {
      x:
        -minX * zoomRatio +
        verticalPaddingOnFitView * zoomRatio +
        stepNodeSize.width,
      y: canvasHeight / 2 - ((minY + maxY) / 2) * zoomRatio,
      zoom: zoomRatio,
    };
  }
  const boundingBox = flowCanvasUtils.calculateGraphBoundingBox({
    graph: {
      nodes,
      edges: [],
    },
    orientation,
  });
  const graphHeight = boundingBox.height;
  // Fit against the wider side (extents from the trunk centre) so the outermost
  // branch stays on-screen with the trunk centred; else wide router flows overflow.
  const halfSpan = Math.max(
    boundingBox.left,
    boundingBox.right,
    flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
  );
  const zoomToFitHeight = canvasHeight / graphHeight;
  const zoomToFitWidth =
    (canvasWidth / 2 - horizontalPaddingOnFitView) / halfSpan;
  const zoomRatio = Math.min(
    Math.max(Math.min(zoomToFitHeight, zoomToFitWidth), zoomFloor),
    1.25,
  );
  return {
    x:
      canvasWidth / 2 -
      (flowCanvasConsts.AP_NODE_SIZE.STEP.width * zoomRatio) / 2,
    y:
      nodes[0].position.y +
      verticalPaddingOnFitView * zoomRatio +
      flowCanvasConsts.AP_NODE_SIZE.STEP.height,
    zoom: zoomRatio,
  };
}

// Glide the viewport to `target` on easeStageTransition (the shared morph curve),
// reading the current viewport on frame one so it starts wherever the anchor left
// it. Returns a cancel fn.
function tweenViewport({
  getViewport,
  setViewport,
  target,
  durationMs,
}: {
  getViewport: () => Viewport;
  setViewport: (viewport: Viewport) => void;
  target: Viewport;
  durationMs: number;
}): () => void {
  let rafId = 0;
  let start: number | null = null;
  let from: Viewport | null = null;
  const tick = (now: number) => {
    if (start === null || from === null) {
      start = now;
      from = getViewport();
    }
    const progress =
      durationMs <= 0 ? 1 : Math.min((now - start) / durationMs, 1);
    const eased = easeStageTransition(progress);
    setViewport({
      x: from.x + (target.x - from.x) * eased,
      y: from.y + (target.y - from.y) * eased,
      zoom: from.zoom + (target.zoom - from.zoom) * eased,
    });
    if (progress < 1) {
      rafId = window.requestAnimationFrame(tick);
    }
  };
  rafId = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(rafId);
}

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
  const { setViewport, getNodes, getNode, getViewport } =
    useReactFlow<ApNode>();
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const stageTier = useStageOptional()?.stageTier ?? 'comfortable';
  const zoomFloor = fitZoomFloorForTier(stageTier);

  const handleFitToView = useCallback(
    ({
      isInitialRenderCall,
      orientation,
    }: {
      isInitialRenderCall: boolean;
      orientation?: CanvasOrientation;
    }) => {
      const effectiveOrientation = orientation ?? canvasOrientation;
      const target = computeFitViewport({
        nodes: getNodes(),
        canvasWidth,
        canvasHeight,
        orientation: effectiveOrientation,
        zoomFloor,
      });
      if (!target) return;
      const settleDuration =
        effectiveOrientation === 'horizontal' ? STAGE_TRANSITION_MS : 500;
      setViewport(target, {
        duration: isInitialRenderCall ? 0 : settleDuration,
      });
    },
    [
      getNodes,
      canvasHeight,
      setViewport,
      canvasWidth,
      canvasOrientation,
      zoomFloor,
    ],
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
  node: ApNode,
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

export { useFitToView, computeFitViewport, tweenViewport, fitZoomFloorForTier };
