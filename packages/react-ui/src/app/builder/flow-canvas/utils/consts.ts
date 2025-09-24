import { ApLoopReturnLineCanvasEdge as ApLoopReturnCanvasEdge } from '../edges/loop-return-edge';
import { ApLoopStartLineCanvasEdge as ApLoopStartCanvasEdge } from '../edges/loop-start-edge';
import { ApRouterEndCanvasEdge } from '../edges/router-end-edge';
import { ApRouterStartCanvasEdge } from '../edges/router-start-edge';
import { ApStraightLineCanvasEdge } from '../edges/straight-line-edge';
import { ApBigAddButtonCanvasNode } from '../nodes/big-add-button-node';
import ApGraphEndWidgetNode from '../nodes/flow-end-widget-node';
import ApLoopReturnCanvasNode from '../nodes/loop-return-node';
import { ApStepCanvasNode } from '../nodes/step-node';

import { ApEdgeType, ApNodeType } from './types';

const ARC_LENGTH = 15;
const ARC_LEFT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_LEFT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_UP = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},-${ARC_LENGTH}`;
const ARC_LEFT_UP = `a-${ARC_LENGTH},-${ARC_LENGTH} 0 0,0 ${ARC_LENGTH},-${ARC_LENGTH}`;
const ARROW_DOWN = 'm6 -6 l-6 6 m-6 -6 l6 6';
const VERTICAL_SPACE_BETWEEN_STEP_AND_LINE = 7;
const VERTICAL_SPACE_BETWEEN_STEPS = 85;
const VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD =
  VERTICAL_SPACE_BETWEEN_STEPS * 1.5 + 2 * ARC_LENGTH;
const LABEL_HEIGHT = 30;
const LABEL_VERTICAL_PADDING = 12;
const STEP_DRAG_OVERLAY_WIDTH = 100;
const STEP_DRAG_OVERLAY_HEIGHT = 100;
const VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD =
  VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD + LABEL_HEIGHT;
const LINE_WIDTH = 1.5;
const DRAGGED_STEP_TAG = 'dragged-step';
const HORIZONTAL_SPACE_BETWEEN_NODES = 80;
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
  LABEL_HEIGHT,
  ARC_LEFT_UP,
  VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD,
  doesNodeAffectBoundingBox: doesNodeAffectBoundingBoxWidth,
  edgeTypes: {
    [ApEdgeType.STRAIGHT_LINE]: ApStraightLineCanvasEdge,
    [ApEdgeType.LOOP_START_EDGE]: ApLoopStartCanvasEdge,
    [ApEdgeType.LOOP_RETURN_EDGE]: ApLoopReturnCanvasEdge,
    [ApEdgeType.ROUTER_START_EDGE]: ApRouterStartCanvasEdge,
    [ApEdgeType.ROUTER_END_EDGE]: ApRouterEndCanvasEdge,
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
  LABEL_VERTICAL_PADDING,
  STEP_DRAG_OVERLAY_WIDTH,
  STEP_DRAG_OVERLAY_HEIGHT,
};

export const STEP_CONTEXT_MENU_ATTRIBUTE = 'step-context-menu';
export const SELECTION_RECT_CHEVRON_ATTRIBUTE = 'selection-rect-chevron';
export const EMPTY_STEP_PARENT_NAME = 'empty-step-parent';
export const LEFT_SIDEBAR_ID = 'builder-left-sidebar';
export const BUILDER_NAVIGATION_SIDEBAR_ID = 'builder-navigation-sidebar';
