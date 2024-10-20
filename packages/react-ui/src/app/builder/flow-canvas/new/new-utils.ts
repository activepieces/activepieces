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
) => ApGraph = (parentStep, nodeData) => {
  const bigAddButtonNode: ApBigAddButtonNode = {
    id: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    type: ApNodeType.BIG_ADD_BUTTON,
    position: { x: 0, y: 0 },
    data: nodeData,
  };
  const graphEndNode: ApGraphEndNode = {
    id: `${parentStep.name}-subgraph-end`,
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
    id: `${parentStep.name}-${parentStep.nextAction?.name ?? 'graph-end'}-edge`,
    source: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    target: `${parentStep.name}-subgraph-end`,
    type: ApEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: false,
      hideAddButton: true,
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
    step.type === ActionType.LOOP_ON_ITEMS ? buildLoopChildGraph(step) : null;
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
      .map(
        (node) => node.position.x - flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      ),
  );
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes
      .filter((node) => flowUtilConsts.doesNodeAffectBoundingBox(node.type))
      .map(
        (node) => node.position.x + flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      ),
  );
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y));
  const width = maxX - minX;
  const height = maxY - minY;

  return { width, height, left: minX, right: maxX, top: minY, bottom: maxY };
};

const buildLoopChildGraph: (step: LoopOnItemsAction) => ApGraph = (step) => {
  const childGraph = step.firstLoopAction
    ? buildGraph(step.firstLoopAction)
    : createBigAddButtonGraph(step, {
        parentStepName: step.name,
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        edgeId: `${step.name}-loop-start-edge`,
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
      id: `${step.name}-loop-return-edge`,
      source: `${childGraph.nodes[childGraph.nodes.length - 1].id}`,
      target: `${step.name}`,
      type: ApEdgeType.LOOP_RETURN_EDGE as const,
      data: {
        parentStepName: step.name,
        isLoopEmpty: isNil(step.firstLoopAction),
        drawArrowHeadAfterEnd: !isNil(step.nextAction),
      },
    },
  ];

  const childGraphBoundingBox = calculateGraphBoundingBox(childGraph);
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x: flowUtilConsts.AP_NODE_SIZE.STEP.width / 2 + childGraphBoundingBox.left,
    y:
      flowUtilConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
      flowUtilConsts.AP_NODE_SIZE.STEP.height,
  });

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

  return {
    nodes: [loopReturnNode, ...childGraphAfterOffset.nodes, subgraphEndSubNode],
    edges: [...edges, ...childGraphAfterOffset.edges],
  };
};
