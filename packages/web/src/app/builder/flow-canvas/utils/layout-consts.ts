import {
  FLOW_CANVAS_ARC,
  FLOW_CANVAS_HSPACE,
  FLOW_CANVAS_LOOP_VOFFSET,
  FLOW_CANVAS_ROUTER_VOFFSET,
  FLOW_CANVAS_STEP_HEIGHT,
  FLOW_CANVAS_STEP_WIDTH,
  FLOW_CANVAS_VSPACE,
} from '@activepieces/shared';

import { ApNodeType, CanvasOrientation } from './types';

const ARC_LENGTH = FLOW_CANVAS_ARC;
const HORIZONTAL_LAYOUT_SPACE_BETWEEN_STEPS = 80;
const HORIZONTAL_STEP_SIZE = 80;
// extra room on branch entry lines so the label can sit on the line next to the add button
const HORIZONTAL_BRANCH_LABEL_SPACE = 70;
const STEP_NODE_SIZE: Record<
  CanvasOrientation,
  { width: number; height: number }
> = {
  vertical: {
    width: FLOW_CANVAS_STEP_WIDTH,
    height: FLOW_CANVAS_STEP_HEIGHT,
  },
  horizontal: {
    width: HORIZONTAL_STEP_SIZE,
    height: HORIZONTAL_STEP_SIZE,
  },
};
const ORIENTATION_LAYOUT: Record<CanvasOrientation, OrientationLayout> = {
  vertical: {
    stepAlongSize: FLOW_CANVAS_STEP_HEIGHT,
    stepCrossSize: FLOW_CANVAS_STEP_WIDTH,
    spaceAlongBetweenSteps: FLOW_CANVAS_VSPACE,
    loopOffsetAlong: FLOW_CANVAS_LOOP_VOFFSET,
    routerOffsetAlong: FLOW_CANVAS_ROUTER_VOFFSET,
    crossGapBetweenBranches: FLOW_CANVAS_HSPACE,
  },
  horizontal: {
    stepAlongSize: HORIZONTAL_STEP_SIZE,
    stepCrossSize: HORIZONTAL_STEP_SIZE,
    spaceAlongBetweenSteps: HORIZONTAL_LAYOUT_SPACE_BETWEEN_STEPS,
    loopOffsetAlong:
      HORIZONTAL_LAYOUT_SPACE_BETWEEN_STEPS * 1.5 + 2 * FLOW_CANVAS_ARC,
    routerOffsetAlong:
      HORIZONTAL_LAYOUT_SPACE_BETWEEN_STEPS * 1.5 +
      2 * FLOW_CANVAS_ARC +
      HORIZONTAL_BRANCH_LABEL_SPACE,
    crossGapBetweenBranches: 90,
  },
};

const NODE_SELECTION_RECT_CLASS_NAME = 'react-flow__nodesselection-rect';

const doesNodeAffectBoundingBoxWidth: (
  type: ApNodeType,
) => type is
  | ApNodeType.BIG_ADD_BUTTON
  | ApNodeType.STEP
  | ApNodeType.LOOP_RETURN_NODE = (type) =>
  type === ApNodeType.BIG_ADD_BUTTON ||
  type === ApNodeType.STEP ||
  type === ApNodeType.LOOP_RETURN_NODE;

export const flowCanvasLayoutConsts = {
  ARC_LENGTH,
  ORIENTATION_LAYOUT,
  STEP_NODE_SIZE,
  NODE_SELECTION_RECT_CLASS_NAME,
  doesNodeAffectBoundingBox: doesNodeAffectBoundingBoxWidth,
};

type OrientationLayout = {
  stepAlongSize: number;
  stepCrossSize: number;
  spaceAlongBetweenSteps: number;
  loopOffsetAlong: number;
  routerOffsetAlong: number;
  crossGapBetweenBranches: number;
};
