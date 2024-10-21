import { t } from 'i18next';
import {
  Action,
  ActionType,
  BranchAction,
  flowHelper,
  FlowVersion,
  isNil,
  LoopOnItemsAction,
  RouterAction,
  StepLocationRelativeToParent,
  Trigger,
} from '../../../../../../shared/src';
import { AP_NODE_SIZE } from '../flow-canvas-utils';
import { flowUtilConsts } from './consts';
import {
  ApBigAddButtonNode,
  ApEdge,
  ApEdgeType,
  ApGraph,
  ApGraphEndNode,
  ApLoopReturnNode,
  ApNodeType,
  ApStepNode,
  ApStraightLineEdge,
} from './types';

export const newFloWUtils = {
  convertFlowVersionToGraph(version: FlowVersion): ApGraph {
    const graph = buildGraph(version.trigger);
    const graphEndWidget = graph.nodes.findLast(
      (node) => node.type === ApNodeType.GRAPH_END_WIDGET,
    );
    if (graphEndWidget) {
      graphEndWidget.data.showWidget = true;
    } else {
      console.warn('Flow end widget not found');
    }
    return graph;
  },
  createFocusStepInGraphParams,
};

const createBigAddButtonGraph: (
  parentStep: LoopOnItemsAction | BranchAction | RouterAction,
  nodeData: ApBigAddButtonNode['data'],
  branchName: string,
) => ApGraph = (parentStep, nodeData, branchName) => {
  const bigAddButtonNode: ApBigAddButtonNode = {
    id: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    type: ApNodeType.BIG_ADD_BUTTON,
    position: { x: 0, y: 0 },
    data: nodeData,
  };
  const graphEndNode: ApGraphEndNode = {
    id: `${parentStep.name}-subgraph-end-${nodeData.edgeId}`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
  };

  const straightLineEdge: ApStraightLineEdge = {
    id: `${parentStep.name}-${branchName}-edge`,
    source: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    target: `${parentStep.name}-subgraph-end-${nodeData.edgeId}`,
    type: ApEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: false,
      hideAddButton: true,
      parentStepName: parentStep.name,
    },
  };
  return {
    nodes: [bigAddButtonNode, graphEndNode],
    edges: [straightLineEdge],
  };
};

const createStepGraph: (
  step: Action | Trigger,
  graphHeight: number,
) => ApGraph = (step, graphHeight) => {
  const stepNode: ApStepNode = {
    id: step.name,
    type: ApNodeType.STEP as const,
    position: { x: 0, y: 0 },
    data: {
      step,
    },
  };
  const graphEndNode: ApGraphEndNode = {
    id: `${step.name}-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      y: graphHeight,
    },
    data: {},
  };

  const straightLineEdge: ApStraightLineEdge = {
    id: `${step.name}-${step.nextAction?.name ?? 'graph-end'}-edge`,
    source: step.name,
    target: `${step.name}-subgraph-end`,
    type: ApEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: !isNil(step.nextAction),
      parentStepName: step.name,
    },
  };
  return {
    nodes: [stepNode, graphEndNode],
    edges:
      step.type !== ActionType.BRANCH &&
      step.type !== ActionType.LOOP_ON_ITEMS &&
      step.type !== ActionType.ROUTER
        ? [straightLineEdge]
        : [],
  };
};

const buildGraph: (step: Action | Trigger | undefined) => ApGraph = (step) => {
  if (isNil(step)) {
    return {
      nodes: [],
      edges: [],
    };
  }

  const graph: ApGraph = createStepGraph(
    step,
    flowUtilConsts.AP_NODE_SIZE.STEP.height +
      flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS,
  );
  const childGraph =
    step.type === ActionType.LOOP_ON_ITEMS
      ? buildLoopChildGraph(step)
      : step.type === ActionType.BRANCH
      ? buildBranchChildGraph(step)
      : null;

  const graphWithChild = childGraph ? mergeGraph(graph, childGraph) : graph;
  const nextStepGraph = buildGraph(step.nextAction);
  return mergeGraph(
    graphWithChild,
    offsetGraph(nextStepGraph, {
      x: 0,
      y: calculateGraphBoundingBox(graphWithChild).height,
    }),
  );
};

function offsetGraph(
  graph: ApGraph,
  offset: { x: number; y: number },
): ApGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    })),
    edges: graph.edges,
  };
}

function mergeGraph(graph1: ApGraph, graph2: ApGraph): ApGraph {
  return {
    nodes: [...graph1.nodes, ...graph2.nodes],
    edges: [...graph1.edges, ...graph2.edges],
  };
}

function createFocusStepInGraphParams(stepName: string) {
  return {
    nodes: [{ id: stepName }],
    duration: 1000,
    maxZoom: 1,
    minZoom: 1,
  };
}

const calculateGraphBoundingBox = (graph: ApGraph) => {
  const minX = Math.min(
    ...graph.nodes
      .filter((node) => flowUtilConsts.doesNodeAffectBoundingBox(node.type))
      .map((node) => node.position.x),
  );
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes
      .filter((node) => flowUtilConsts.doesNodeAffectBoundingBox(node.type))
      .map((node) => node.position.x + flowUtilConsts.AP_NODE_SIZE.STEP.width),
  );
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    width,
    height,
    left: -minX + flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
    right: maxX - flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
    top: minY,
    bottom: maxY,
  };
};

const buildLoopChildGraph: (step: LoopOnItemsAction) => ApGraph = (step) => {
  const childGraph = step.firstLoopAction
    ? buildGraph(step.firstLoopAction)
    : createBigAddButtonGraph(
        step,
        {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_LOOP,
          edgeId: `${step.name}-loop-start-edge`,
        },
        'loop-emptyLoop',
      );

  const childGraphBoundingBox = calculateGraphBoundingBox(childGraph);
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x:
      childGraphBoundingBox.width / 2 +
      flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES,
    y:
      flowUtilConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
      flowUtilConsts.AP_NODE_SIZE.STEP.height,
  });

  const edges: ApEdge[] = [
    {
      id: `${step.name}-loop-start-edge`,
      source: step.name,
      target: `${childGraph.nodes[0].id}`,
      type: ApEdgeType.LOOP_START_EDGE as const,
      data: {
        isLoopEmpty: isNil(step.firstLoopAction),
      },
    },
    {
      id: `${step.name}-loop-return-node`,
      source: `${childGraph.nodes[childGraph.nodes.length - 1].id}`,
      target: `${step.name}-loop-return-node`,
      type: ApEdgeType.LOOP_RETURN_EDGE as const,
      data: {
        parentStepName: step.name,
        isLoopEmpty: isNil(step.firstLoopAction),
        drawArrowHeadAfterEnd: !isNil(step.nextAction),
        verticalSpaceBetweenReturnNodeStartAndEnd:
          childGraphBoundingBox.height +
          flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS,
      },
    },
  ];

  const loopReturnNode: ApLoopReturnNode = {
    id: `${step.name}-loop-return-node`,
    type: ApNodeType.LOOP_RETURN_NODE,
    position: {
      x:
        flowUtilConsts.AP_NODE_SIZE.STEP.width / 2 -
        childGraphBoundingBox.width / 2 -
        flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height / 2,
    },
    data: {},
  };

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${step.name}-loop-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height +
        flowUtilConsts.ARC_LENGTH +
        flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
  };

  return {
    nodes: [loopReturnNode, ...childGraphAfterOffset.nodes, subgraphEndSubNode],
    edges: [...edges, ...childGraphAfterOffset.edges],
  };
};

const buildBranchChildGraph = (step: BranchAction) => {
  const trueBranchGraph = step.onSuccessAction
    ? buildGraph(step.onSuccessAction)
    : createBigAddButtonGraph(
        step,
        {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
          edgeId: `${step.name}-true-start-edge`,
        },
        'true-starter',
      );

  const falseBranchGraph = step.onFailureAction
    ? buildGraph(step.onFailureAction)
    : createBigAddButtonGraph(
        step,
        {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
          edgeId: `${step.name}-false-start-edge`,
        },
        'false-starter',
      );

  const trueBranchGraphBoundingBox = calculateGraphBoundingBox(trueBranchGraph);

  const falseBranchGraphBoundingBox =
    calculateGraphBoundingBox(falseBranchGraph);

  const maxHeight = Math.max(
    trueBranchGraphBoundingBox.height,
    falseBranchGraphBoundingBox.height,
  );

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${step.name}-branch-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD +
        maxHeight +
        flowUtilConsts.ARC_LENGTH +
        flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
  };

  const totalWidth =
    trueBranchGraphBoundingBox.width +
    falseBranchGraphBoundingBox.width +
    flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES;

  let deltaLeftX =
    -(
      totalWidth -
      trueBranchGraphBoundingBox.left -
      falseBranchGraphBoundingBox.right
    ) /
      2 -
    trueBranchGraphBoundingBox.left;

  const trueBranchGraphAfterOffset = offsetGraph(trueBranchGraph, {
    x: deltaLeftX + trueBranchGraphBoundingBox.left,
    y:
      flowUtilConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD +
      flowUtilConsts.AP_NODE_SIZE.STEP.height,
  });

  const falseBranchGraphAfterOffset = offsetGraph(falseBranchGraph, {
    x:
      flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES +
      deltaLeftX +
      trueBranchGraphBoundingBox.width +
      falseBranchGraphBoundingBox.left,
    y:
      flowUtilConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD +
      flowUtilConsts.AP_NODE_SIZE.STEP.height,
  });

  const edges: ApEdge[] = [
    {
      id: `${step.name}-true-branch-start-edge`,
      source: step.name,
      target: `${trueBranchGraph.nodes[0].id}`,
      type: ApEdgeType.ROUTER_START_EDGE as const,
      data: {
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
        drawStartingVerticalLine: true,
        label: t('True'),
        isBranchEmpty: isNil(step.onSuccessAction),
      },
    },
    {
      id: `${step.name}-false-branch-start-edge`,
      source: step.name,
      target: `${falseBranchGraph.nodes[0].id}`,
      type: ApEdgeType.ROUTER_START_EDGE as const,
      data: {
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
        drawStartingVerticalLine: false,
        label: t('False'),
        isBranchEmpty: isNil(step.onFailureAction),
      },
    },

    {
      id: `${step.name}-false-branch-end-edge`,
      source: `${falseBranchGraph.nodes.at(-1)!.id}`,
      target: subgraphEndSubNode.id,
      type: ApEdgeType.ROUTER_END_EDGE as const,
      data: {
        drawEndingVerticalLine: true,
        routerOrBranchStepName: step.name,
        isNextStepEmpty: isNil(step.nextAction),
        verticalSpaceBetweenLastNodeInBranchAndEndLine:
          subgraphEndSubNode.position.y -
          falseBranchGraphAfterOffset.nodes.at(-1)!.position.y -
          flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
          flowUtilConsts.ARC_LENGTH,
        drawEndingArc: true,
      },
    },
    {
      id: `${step.name}-true-branch-end-edge`,
      source: `${trueBranchGraph.nodes.at(-1)!.id}`,
      target: subgraphEndSubNode.id,
      type: ApEdgeType.ROUTER_END_EDGE as const,
      data: {
        drawEndingVerticalLine: false,
        verticalSpaceBetweenLastNodeInBranchAndEndLine:
          subgraphEndSubNode.position.y -
          trueBranchGraphAfterOffset.nodes.at(-1)!.position.y -
          flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
          flowUtilConsts.ARC_LENGTH,
        drawEndingArc: true,
      },
    },
  ];

  return {
    nodes: [
      ...trueBranchGraphAfterOffset.nodes,
      ...falseBranchGraphAfterOffset.nodes,
      subgraphEndSubNode,
    ],
    edges: [
      ...edges,
      ...trueBranchGraphAfterOffset.edges,
      ...falseBranchGraphAfterOffset.edges,
    ],
  };
};
