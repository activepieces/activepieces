import { Edge } from '@xyflow/react';

import {
  Action,
  StepLocationRelativeToParent,
  Trigger,
} from '@activepieces/shared';

export enum ApNodeType {
  STEP = 'STEP',
  ADD_BUTTON = 'ADD_BUTTON',
  BIG_ADD_BUTTON = 'BIG_ADD_BUTTON',
  GRAPH_END_WIDGET = 'GRAPH_END_WIDGET',
  GRAPH_START_WIDGET = 'GRAPH_START_WIDGET',
  /**Used for calculating the loop graph width */
  LOOP_RETURN_NODE = 'LOOP_RETURN_NODE',
}
export type ApBoundingBox = {
  width: number;
  height: number;
  left: number;
  right: number;
};

export type ApStepNode = {
  id: string;
  type: ApNodeType.STEP;
  position: {
    x: number;
    y: number;
  };
  data: {
    step: Action | Trigger;
  };
};

export type ApLoopReturnNode = {
  id: string;
  type: ApNodeType.LOOP_RETURN_NODE;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, never>;
};

export type ApButtonData =
  | {
      edgeId: string;
      parentStepName: string;
      stepLocationRelativeToParent:
        | StepLocationRelativeToParent.AFTER
        | StepLocationRelativeToParent.INSIDE_LOOP;
    }
  | {
      edgeId: string;
      parentStepName: string;
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
      branchIndex: number;
    };

export type ApBigAddButtonNode = {
  id: string;
  type: ApNodeType.BIG_ADD_BUTTON;
  position: {
    x: number;
    y: number;
  };
  data: ApButtonData;
};

export type ApGraphEndNode = {
  id: string;
  type: ApNodeType.GRAPH_END_WIDGET;
  position: {
    x: number;
    y: number;
  };
  data: {
    showWidget?: boolean;
  };
};

export type ApNode =
  | ApStepNode
  | ApGraphEndNode
  | ApBigAddButtonNode
  | ApLoopReturnNode;

export enum ApEdgeType {
  STRAIGHT_LINE = 'ApStraightLineEdge',
  LOOP_START_EDGE = 'ApLoopStartEdge',
  LOOP_CLOSE_EDGE = 'ApLoopCloseEdge',
  LOOP_RETURN_EDGE = 'ApLoopReturnEdge',
  ROUTER_START_EDGE = 'ApRouterStartEdge',
  ROUTER_END_EDGE = 'ApRouterEndEdge',
}

export type ApStraightLineEdge = Edge & {
  type: ApEdgeType.STRAIGHT_LINE;
  data: {
    drawArrowHead: boolean;
    hideAddButton?: boolean;
    parentStepName: string;
  };
};

export type ApLoopStartEdge = Edge & {
  type: ApEdgeType.LOOP_START_EDGE;
  data: {
    isLoopEmpty: boolean;
  };
};

export type ApLoopCloseEdge = Edge & {
  type: ApEdgeType.LOOP_CLOSE_EDGE;
};

export type ApLoopReturnEdge = Edge & {
  type: ApEdgeType.LOOP_RETURN_EDGE;
  data: {
    parentStepName: string;
    isLoopEmpty: boolean;
    drawArrowHeadAfterEnd: boolean;
    verticalSpaceBetweenReturnNodeStartAndEnd: number;
  };
};

export type ApRouterStartEdge = Edge & {
  type: ApEdgeType.ROUTER_START_EDGE;
  data: {
    isBranchEmpty: boolean;
    label: string;
    drawHorizontalLine: boolean;
    drawStartingVerticalLine: boolean;
  } & {
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
    branchIndex: number;
  };
};

export type ApRouterEndEdge = Edge & {
  type: ApEdgeType.ROUTER_END_EDGE;
  data: {
    drawHorizontalLine: boolean;
    verticalSpaceBetweenLastNodeInBranchAndEndLine: number;
  } & (
    | {
        routerOrBranchStepName: string;
        drawEndingVerticalLine: true;
        isNextStepEmpty: boolean;
      }
    | {
        drawEndingVerticalLine: false;
      }
  );
};

export type ApEdge =
  | ApLoopStartEdge
  | ApLoopReturnEdge
  | ApStraightLineEdge
  | ApRouterStartEdge
  | ApRouterEndEdge;
export type ApGraph = {
  nodes: ApNode[];
  edges: ApEdge[];
};
