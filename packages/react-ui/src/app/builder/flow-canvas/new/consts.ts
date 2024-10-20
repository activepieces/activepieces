import { ApStepCanvasNode } from './nodes/step-node';
import { ApStraightLineCanvasEdge } from './edges/straight-line-edge';
import { ApEdgeType, ApNodeType } from './types';
import ApGraphEndWidgetNode from './nodes/flow-end-widget-node';
import { ApLoopStartLineCanvasEdge } from './edges/loop-start-line-edge';
import ApLoopReturnCanvasNode from './nodes/loop-return-node';
import { ApBigAddButtonCanvasNode } from './nodes/big-add-button-node';
import { ApLoopReturnLineCanvasEdge } from './edges/loop-return-line-edge';

const ARC_LENGTH = 15;
const ARC_LEFT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_LEFT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_UP = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},-${ARC_LENGTH}`;
const ARROW_DOWN = 'm6 -6 l-6 6 m-6 -6 l6 6';
const VERTICAL_SPACE_BETWEEN_STEP_AND_LINE = 7;
const VERTICAL_SPACE_BETWEEN_STEPS = 85;
const VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD =
  VERTICAL_SPACE_BETWEEN_STEPS * 1.5 + 2 * ARC_LENGTH;

const LINE_WIDTH = 1.5;
const DRAGGED_STEP_TAG = 'dragged-step';
const HORIZONTAL_SPACE_BETWEEN_NODES = 40;

const AP_NODE_SIZE: Record<
  Exclude<ApNodeType, ApNodeType.GRAPH_START_WIDGET>,
  { height: number; width: number }
> = {
  [ApNodeType.BIG_ADD_BUTTON]: {
    height: 50,
    width: 50,
  },
  [ApNodeType.ADD_BUTTON]: {
    height: 18,
    width: 18,
  },
  [ApNodeType.STEP]: {
    height: 70,
    width: 260,
  },
  [ApNodeType.LOOP_RETURN_NODE]: {
    height: 70,
    width: 260,
  },
  [ApNodeType.GRAPH_END_WIDGET]: {
    height: 0,
    width: 0,
  },
};

const doesNodeAffectBoundingBoxWidth: (
  type: ApNodeType,
) => type is
  | ApNodeType.BIG_ADD_BUTTON
  | ApNodeType.STEP
  | ApNodeType.LOOP_RETURN_NODE = (type) =>
  type === ApNodeType.BIG_ADD_BUTTON ||
  type === ApNodeType.STEP ||
  type === ApNodeType.LOOP_RETURN_NODE;
export const flowUtilConsts = {
  ARC_LENGTH,
  ARC_LEFT,
  ARC_RIGHT,
  ARC_LEFT_DOWN,
  ARC_RIGHT_DOWN,
  VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD,
  AP_NODE_SIZE,
  VERTICAL_SPACE_BETWEEN_STEP_AND_LINE,
  ARROW_DOWN,
  VERTICAL_SPACE_BETWEEN_STEPS,
  ARC_RIGHT_UP,
  LINE_WIDTH,
  doesNodeAffectBoundingBox: doesNodeAffectBoundingBoxWidth,
  edgeTypes: {
    [ApEdgeType.STRAIGHT_LINE]: ApStraightLineCanvasEdge,
    [ApEdgeType.LOOP_START_EDGE]: ApLoopStartLineCanvasEdge,
    [ApEdgeType.LOOP_RETURN_EDGE]: ApLoopReturnLineCanvasEdge,
  },
  nodeTypes: {
    [ApNodeType.STEP]: ApStepCanvasNode,
    [ApNodeType.LOOP_RETURN_NODE]: ApLoopReturnCanvasNode,
    [ApNodeType.BIG_ADD_BUTTON]: ApBigAddButtonCanvasNode,
    [ApNodeType.GRAPH_END_WIDGET]: ApGraphEndWidgetNode,
  },
  DRAGGED_STEP_TAG,
  HORIZONTAL_SPACE_BETWEEN_NODES,
  HANDLE_STYLING: { opacity: 0, cursor: 'default' },
};
