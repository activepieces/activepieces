import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowVersion,
  flowStructureUtil,
} from '@activepieces/shared';

import { canvasElementIds } from './canvas-element-ids';
import { flowCanvasLayoutConsts } from './layout-consts';
import {
  ApBatchRegionNode,
  ApGraph,
  ApNode,
  ApNodeType,
  CanvasOrientation,
} from './types';

const buildBatchRegionNodes = ({
  graph,
  version,
  orientation,
}: {
  graph: ApGraph;
  version: FlowVersion;
  orientation: CanvasOrientation;
}): ApBatchRegionNode[] =>
  flowStructureUtil
    .getAllSteps(version.trigger)
    .filter((step) => step.type === FlowActionType.PROCESS_IN_BATCHES)
    .map((batchStep) =>
      buildBatchRegion({
        graph,
        batchName: batchStep.name,
        childStepNames: batchStep.firstLoopAction
          ? flowStructureUtil
              .getAllSteps(batchStep.firstLoopAction)
              .map((step) => step.name)
          : [],
        orientation,
      }),
    )
    .filter((region): region is ApBatchRegionNode => !isNil(region));

const buildBatchRegion = ({
  graph,
  batchName,
  childStepNames,
  orientation,
}: {
  graph: ApGraph;
  batchName: string;
  childStepNames: string[];
  orientation: CanvasOrientation;
}): ApBatchRegionNode | null => {
  const layout = flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];
  const batchNode = graph.nodes.find((node) => node.id === batchName);
  const batchSubgraphEndNode = graph.nodes.find(
    (node) => node.id === canvasElementIds.batchSubgraphEndId(batchName),
  );
  if (isNil(batchNode) || isNil(batchSubgraphEndNode)) {
    return null;
  }
  const childIdPrefixes = [
    ...childStepNames,
    canvasElementIds.bigAddButtonId({
      parentStepName: batchName,
      edgeId: canvasElementIds.batchStartEdgeId(batchName),
    }),
  ];
  const childXRanges = graph.nodes
    .filter(
      (node) =>
        flowCanvasLayoutConsts.doesNodeAffectBoundingBox(node.type) &&
        isBatchBodyNode({ node, childIdPrefixes }),
    )
    .map((node) => getPaddedXRange({ node, orientation }));
  if (childXRanges.length === 0) {
    return null;
  }
  const batchPosition = batchNode.position;
  const top = batchPosition.y + layout.stepAlongSize / 2;
  const bottom =
    batchSubgraphEndNode.position.y - layout.spaceAlongBetweenSteps;
  const left = Math.min(
    batchPosition.x - SIDE_PADDING,
    ...childXRanges.map((range) => range.left),
  );
  const right = Math.max(
    batchPosition.x + layout.stepCrossSize + SIDE_PADDING,
    ...childXRanges.map((range) => range.right),
  );
  return {
    id: canvasElementIds.batchRegionId(batchName),
    type: ApNodeType.BATCH_REGION,
    position: { x: left, y: top },
    data: {
      stepName: batchName,
      size: { width: right - left, height: bottom - top },
    },
    selectable: false,
    draggable: false,
    zIndex: 0,
  };
};

const isBatchBodyNode = ({
  node,
  childIdPrefixes,
}: {
  node: ApNode;
  childIdPrefixes: string[];
}) =>
  childIdPrefixes.some(
    (prefix) => node.id === prefix || node.id.startsWith(`${prefix}-`),
  );

const getPaddedXRange = ({
  node,
  orientation,
}: {
  node: ApNode;
  orientation: CanvasOrientation;
}): { left: number; right: number } => {
  const layout = flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];
  if (node.type !== ApNodeType.LOOP_RETURN_NODE) {
    return {
      left: node.position.x - SIDE_PADDING,
      right: node.position.x + layout.stepCrossSize + SIDE_PADDING,
    };
  }
  const loopReturnX = node.position.x + layout.stepCrossSize / 2;
  return { left: loopReturnX - LOOP_RETURN_PADDING, right: loopReturnX };
};

const SIDE_PADDING = 24;
const LOOP_RETURN_PADDING = 64;

export const batchRegionUtils = {
  buildBatchRegionNodes,
};
