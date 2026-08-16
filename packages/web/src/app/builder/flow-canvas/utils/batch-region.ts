import { isNil, unique } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowVersion,
  flowStructureUtil,
} from '@activepieces/shared';

import { flowCanvasLayoutConsts } from './layout-consts';
import {
  ApBatchRegionBand,
  ApBatchRegionNode,
  ApCanvasHoverTarget,
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
  const boxes = graph.nodes
    .filter(
      (node) =>
        flowCanvasLayoutConsts.doesNodeAffectBoundingBox(node.type) &&
        isMember({ node, prefixes }),
    )
    .map((node) => toBox({ node, graph, orientation }))
    .filter((box): box is Box => !isNil(box));
  if (boxes.length === 0) {
    return null;
  }
  const spine = toLayoutSpace({ position: batchNode.position, orientation });
  const top = spine.along + layout.stepAlongSize + HEADER_GAP;
  const bottom =
    toLayoutSpace({ position: endNode.position, orientation }).along -
    layout.spaceAlongBetweenSteps;
  const bands = buildBands({
    boxes,
    top,
    bottom,
    spine: {
      crossStart: spine.cross,
      crossEnd: spine.cross + layout.stepCrossSize,
    },
  });
  const crossStart = Math.min(...bands.map((band) => band.crossStart));
  const crossEnd = Math.max(...bands.map((band) => band.crossEnd));
  const corners = [
    fromLayoutSpace({ along: top, cross: crossStart, orientation }),
    fromLayoutSpace({ along: bottom, cross: crossEnd, orientation }),
  ];
  const origin = {
    x: Math.min(corners[0].x, corners[1].x) - REGION_MARGIN,
    y: Math.min(corners[0].y, corners[1].y) - REGION_MARGIN,
  };
  const notch = fromLayoutSpace({
    along: top,
    cross: bands[0].crossStart + NOTCH_INSET,
    orientation,
  });
  return {
    id: `${batchName}-batch-region`,
    type: ApNodeType.BATCH_REGION,
    position: origin,
    data: {
      stepName: batchName,
      childNames,
      bands,
      path: toRoundedPath({
        points: bandsToPolygon({ bands, top, bottom }),
        orientation,
        origin,
      }),
      notch: { x: notch.x - origin.x, y: notch.y - origin.y },
      size: {
        width: Math.abs(corners[1].x - corners[0].x) + 2 * REGION_MARGIN,
        height: Math.abs(corners[1].y - corners[0].y) + 2 * REGION_MARGIN,
      },
    },
    selectable: false,
    draggable: false,
    zIndex: 0,
  };
};

const isRegionHighlighted = ({
  stepName,
  childNames,
  selectedNodes,
  hoveredTarget,
}: {
  stepName: string;
  childNames: string[];
  selectedNodes: string[];
  hoveredTarget: ApCanvasHoverTarget | null;
}): boolean => {
  if (selectedNodes.includes(stepName)) {
    return true;
  }
  if (isNil(hoveredTarget)) {
    return false;
  }
  return (
    childNames.includes(hoveredTarget.stepName) ||
    (hoveredTarget.stepName === stepName && hoveredTarget.isInsideStep)
  );
};

const isMember = ({ node, prefixes }: { node: ApNode; prefixes: string[] }) =>
  prefixes.some(
    (prefix) => node.id === prefix || node.id.startsWith(`${prefix}-`),
  );

const toBox = ({
  node,
  graph,
  orientation,
}: {
  node: ApNode;
  graph: ApGraph;
  orientation: CanvasOrientation;
}): Box | null => {
  const layout = flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];
  const { along, cross } = toLayoutSpace({
    position: node.position,
    orientation,
  });
  if (node.type !== ApNodeType.LOOP_RETURN_NODE) {
    return {
      alongStart: along,
      alongEnd: along + layout.stepAlongSize,
      crossStart: cross,
      crossEnd: cross + layout.stepCrossSize,
    };
  }
  const loopNode = graph.nodes.find(
    (other) => `${other.id}${LOOP_RETURN_SUFFIX}` === node.id,
  );
  if (isNil(loopNode)) {
    return null;
  }
  const railTop =
    toLayoutSpace({ position: loopNode.position, orientation }).along +
    layout.stepAlongSize +
    layout.loopOffsetAlong;
  const railCross = cross + layout.stepCrossSize / 2;
  return {
    alongStart: railTop,
    alongEnd: 2 * along - railTop,
    crossStart: railCross,
    crossEnd: railCross,
  };
};

const buildBands = ({
  boxes,
  top,
  bottom,
  spine,
}: {
  boxes: Box[];
  top: number;
  bottom: number;
  spine: { crossStart: number; crossEnd: number };
}): ApBatchRegionBand[] => {
  const cuts = unique(boxes.flatMap((box) => [box.alongStart, box.alongEnd]))
    .filter((cut) => cut > top && cut < bottom)
    .sort((a, b) => a - b);
  const edges = [top, ...cuts, bottom];
  const slices = edges.slice(0, -1).map((start, index) => {
    const end = edges[index + 1];
    const covering = boxes.filter(
      (box) => box.alongStart < end && box.alongEnd > start,
    );
    const solid = covering.filter((box) => box.crossEnd > box.crossStart);
    return {
      start,
      end,
      crossStart:
        covering.length === 0
          ? null
          : Math.min(
              spine.crossStart,
              ...covering.map((box) => box.crossStart),
            ) - CROSS_PADDING,
      crossEnd:
        solid.length === 0
          ? null
          : Math.max(spine.crossEnd, ...solid.map((box) => box.crossEnd)) +
            CROSS_PADDING,
    };
  });
  const filled = slices.map((slice, index) => ({
    start: slice.start,
    end: slice.end,
    crossStart:
      slice.crossStart ?? nearest({ slices, index, side: 'crossStart' }),
    crossEnd: slice.crossEnd ?? nearest({ slices, index, side: 'crossEnd' }),
  }));
  return filled.reduce<ApBatchRegionBand[]>((bands, slice) => {
    const previous = bands[bands.length - 1];
    return !isNil(previous) &&
      previous.crossStart === slice.crossStart &&
      previous.crossEnd === slice.crossEnd
      ? [...bands.slice(0, -1), { ...previous, end: slice.end }]
      : [...bands, slice];
  }, []);
};

const nearest = ({
  slices,
  index,
  side,
}: {
  slices: Slice[];
  index: number;
  side: 'crossStart' | 'crossEnd';
}): number => {
  const above = slices
    .slice(0, index)
    .reverse()
    .find((slice) => !isNil(slice[side]));
  const below = slices.slice(index + 1).find((slice) => !isNil(slice[side]));
  const values = [above?.[side], below?.[side]].filter(
    (value): value is number => !isNil(value),
  );
  return side === 'crossStart' ? Math.min(...values) : Math.max(...values);
};

const bandsToPolygon = ({
  bands,
  top,
  bottom,
}: {
  bands: ApBatchRegionBand[];
  top: number;
  bottom: number;
}): LayoutPoint[] =>
  dropCollinear([
    { along: top, cross: bands[0].crossEnd },
    ...bands.flatMap((band) => [
      { along: band.start, cross: band.crossEnd },
      { along: band.end, cross: band.crossEnd },
    ]),
    { along: bottom, cross: bands[bands.length - 1].crossStart },
    ...bands
      .slice()
      .reverse()
      .flatMap((band) => [
        { along: band.end, cross: band.crossStart },
        { along: band.start, cross: band.crossStart },
      ]),
    { along: top, cross: bands[0].crossStart },
  ]);

const dropCollinear = (points: LayoutPoint[]): LayoutPoint[] => {
  const distinct = points.filter((point, index) => {
    const previous = points[index - 1];
    return (
      isNil(previous) ||
      previous.along !== point.along ||
      previous.cross !== point.cross
    );
  });
  return distinct.filter((point, index) => {
    const previous = distinct[index - 1];
    const next = distinct[index + 1];
    return (
      isNil(previous) ||
      isNil(next) ||
      !(
        (previous.along === point.along && point.along === next.along) ||
        (previous.cross === point.cross && point.cross === next.cross)
      )
    );
  });
};

const toRoundedPath = ({
  points,
  orientation,
  origin,
}: {
  points: LayoutPoint[];
  orientation: CanvasOrientation;
  origin: ScreenPoint;
}): string => {
  const screen = points
    .map((point) =>
      fromLayoutSpace({ along: point.along, cross: point.cross, orientation }),
    )
    .map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }));
  const start = pointAlongSegment({
    from: screen[0],
    to: screen[screen.length - 1],
    distance: CORNER_RADIUS,
  });
  const commands = screen.map((point, index) =>
    cornerCommands({
      previous: screen[index === 0 ? screen.length - 1 : index - 1],
      point,
      next: screen[(index + 1) % screen.length],
    }),
  );
  return [`M ${round(start.x)} ${round(start.y)}`, ...commands, 'Z'].join(' ');
};

const cornerCommands = ({
  previous,
  point,
  next,
}: {
  previous: ScreenPoint;
  point: ScreenPoint;
  next: ScreenPoint;
}): string => {
  const radius = Math.min(
    CORNER_RADIUS,
    distance(previous, point) / 2,
    distance(point, next) / 2,
  );
  const entry = pointAlongSegment({
    from: point,
    to: previous,
    distance: radius,
  });
  const exit = pointAlongSegment({ from: point, to: next, distance: radius });
  const turn =
    (point.x - previous.x) * (next.y - point.y) -
    (point.y - previous.y) * (next.x - point.x);
  return `L ${round(entry.x)} ${round(entry.y)} A ${radius} ${radius} 0 0 ${
    turn > 0 ? 1 : 0
  } ${round(exit.x)} ${round(exit.y)}`;
};

const pointAlongSegment = ({
  from,
  to,
  distance: length,
}: {
  from: ScreenPoint;
  to: ScreenPoint;
  distance: number;
}): ScreenPoint => {
  const span = distance(from, to);
  const ratio = span === 0 ? 0 : length / span;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
};

const distance = (from: ScreenPoint, to: ScreenPoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

const round = (value: number) => Math.round(value * 10) / 10;

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

const LOOP_RETURN_SUFFIX = '-loop-return-node';
const HEADER_GAP = 10;
const CROSS_PADDING = 16;
const CORNER_RADIUS = 16;
const NOTCH_INSET = 32;
const REGION_MARGIN = 16;

export const batchRegionUtils = {
  buildBatchRegionNodes,
  isRegionHighlighted,
};

type ScreenPoint = { x: number; y: number };
type LayoutPoint = { along: number; cross: number };
type Box = {
  alongStart: number;
  alongEnd: number;
  crossStart: number;
  crossEnd: number;
};
type Slice = {
  start: number;
  end: number;
  crossStart: number | null;
  crossEnd: number | null;
};
