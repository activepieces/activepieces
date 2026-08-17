import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowVersion,
  flowStructureUtil,
} from '@activepieces/shared';

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
    .map((batch) =>
      buildRegion({
        graph,
        batchName: batch.name,
        childNames: batch.firstLoopAction
          ? flowStructureUtil
              .getAllSteps(batch.firstLoopAction)
              .map((step) => step.name)
          : [],
        orientation,
      }),
    )
    .filter((region): region is ApBatchRegionNode => !isNil(region));

const buildRegion = ({
  graph,
  batchName,
  childNames,
  orientation,
}: {
  graph: ApGraph;
  batchName: string;
  childNames: string[];
  orientation: CanvasOrientation;
}): ApBatchRegionNode | null => {
  const layout = flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];
  const batchNode = graph.nodes.find((node) => node.id === batchName);
  const endNode = graph.nodes.find(
    (node) => node.id === `${batchName}-batch-subgraph-end`,
  );
  if (isNil(batchNode) || isNil(endNode)) {
    return null;
  }
  const prefixes = [...childNames, `${batchName}-big-add-button`];
  const spine = toLayoutSpace({ position: batchNode.position, orientation });
  const extents = graph.nodes
    .filter(
      (node) =>
        flowCanvasLayoutConsts.doesNodeAffectBoundingBox(node.type) &&
        isMember({ node, prefixes }),
    )
    .map((node) => toCrossExtent({ node, orientation }));
  if (extents.length === 0) {
    return null;
  }
  const along = {
    start: spine.along + layout.stepAlongSize / 2,
    end:
      toLayoutSpace({ position: endNode.position, orientation }).along -
      layout.spaceAlongBetweenSteps,
  };
  const cross = {
    start: Math.min(
      spine.cross - CROSS_PADDING,
      ...extents.map((extent) => extent.start),
    ),
    end: Math.max(
      spine.cross + layout.stepCrossSize + CROSS_PADDING,
      ...extents.map((extent) => extent.end),
    ),
  };
  const corners = [
    fromLayoutSpace({ along: along.start, cross: cross.start, orientation }),
    fromLayoutSpace({ along: along.end, cross: cross.end, orientation }),
  ];
  return {
    id: `${batchName}-batch-region`,
    type: ApNodeType.BATCH_REGION,
    position: {
      x: Math.min(corners[0].x, corners[1].x),
      y: Math.min(corners[0].y, corners[1].y),
    },
    data: {
      stepName: batchName,
      size: {
        width: Math.abs(corners[1].x - corners[0].x),
        height: Math.abs(corners[1].y - corners[0].y),
      },
    },
    selectable: false,
    draggable: false,
    zIndex: 0,
  };
};

const isMember = ({ node, prefixes }: { node: ApNode; prefixes: string[] }) =>
  prefixes.some(
    (prefix) => node.id === prefix || node.id.startsWith(`${prefix}-`),
  );

const toCrossExtent = ({
  node,
  orientation,
}: {
  node: ApNode;
  orientation: CanvasOrientation;
}): { start: number; end: number } => {
  const layout = flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];
  const { cross } = toLayoutSpace({ position: node.position, orientation });
  if (node.type !== ApNodeType.LOOP_RETURN_NODE) {
    return {
      start: cross - CROSS_PADDING,
      end: cross + layout.stepCrossSize + CROSS_PADDING,
    };
  }
  const railCross = cross + layout.stepCrossSize / 2;
  return { start: railCross - RAIL_PADDING, end: railCross };
};

const toLayoutSpace = ({
  position,
  orientation,
}: {
  position: ScreenPoint;
  orientation: CanvasOrientation;
}): LayoutPoint =>
  orientation === 'vertical'
    ? { along: position.y, cross: position.x }
    : { along: position.x, cross: position.y };

const fromLayoutSpace = ({
  along,
  cross,
  orientation,
}: {
  along: number;
  cross: number;
  orientation: CanvasOrientation;
}): ScreenPoint =>
  orientation === 'vertical' ? { x: cross, y: along } : { x: along, y: cross };

const CROSS_PADDING = 24;
const RAIL_PADDING = 64;

export const batchRegionUtils = {
  buildBatchRegionNodes,
};

type ScreenPoint = { x: number; y: number };
type LayoutPoint = { along: number; cross: number };
