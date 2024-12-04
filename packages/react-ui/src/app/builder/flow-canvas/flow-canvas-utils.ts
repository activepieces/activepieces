import { t } from 'i18next';

import {
  Action,
  ActionType,
  FlowVersion,
  isNil,
  LoopOnItemsAction,
  RouterAction,
  StepLocationRelativeToParent,
  Trigger,
} from '@activepieces/shared';

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

const createBigAddButtonGraph: (
  parentStep: LoopOnItemsAction | RouterAction,
  nodeData: ApBigAddButtonNode['data'],
) => ApGraph = (parentStep, nodeData) => {
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
    id: `big-button-starigh-line-for${nodeData.edgeId}`,
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
      step.type !== ActionType.LOOP_ON_ITEMS && step.type !== ActionType.ROUTER
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
      : step.type === ActionType.ROUTER
      ? buildRouterChildGraph(step)
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
    maxZoom: 1.25,
    minZoom: 1.25,
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
    : createBigAddButtonGraph(step, {
        parentStepName: step.name,
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        edgeId: `${step.name}-loop-start-edge`,
      });

  const childGraphBoundingBox = calculateGraphBoundingBox(childGraph);
  const deltaLeftX =
    -(
      childGraphBoundingBox.width +
      flowUtilConsts.AP_NODE_SIZE.STEP.width +
      flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES -
      flowUtilConsts.AP_NODE_SIZE.STEP.width / 2 -
      childGraphBoundingBox.right
    ) /
      2 -
    flowUtilConsts.AP_NODE_SIZE.STEP.width / 2;

  const loopReturnNode: ApLoopReturnNode = {
    id: `${step.name}-loop-return-node`,
    type: ApNodeType.LOOP_RETURN_NODE,
    position: {
      x: deltaLeftX + flowUtilConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height / 2,
    },
    data: {},
  };
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x:
      deltaLeftX +
      flowUtilConsts.AP_NODE_SIZE.STEP.width +
      flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES +
      childGraphBoundingBox.left,
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

const buildRouterChildGraph = (step: RouterAction) => {
  const childGraphs = step.children.map((branch, index) => {
    return branch
      ? buildGraph(branch)
      : createBigAddButtonGraph(step, {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_BRANCH,
          branchIndex: index,
          edgeId: `${step.name}-branch-${index}-start-edge`,
        });
  });

  const childGraphsAfterOffset = offsetRouterChildSteps(childGraphs);

  const maxHeight = Math.max(
    ...childGraphsAfterOffset.map((cg) => calculateGraphBoundingBox(cg).height),
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
  const edges: ApEdge[] = childGraphsAfterOffset
    .map((childGraph, branchIndex) => {
      return [
        {
          id: `${step.name}-branch-${branchIndex}-start-edge`,
          source: step.name,
          target: `${childGraph.nodes[0].id}`,
          type: ApEdgeType.ROUTER_START_EDGE as const,
          data: {
            isBranchEmpty: isNil(step.children[branchIndex]),
            label:
              step.settings.branches[branchIndex]?.branchName ??
              `${t('Branch')} ${branchIndex + 1} (missing branch)`,
            branchIndex,
            stepLocationRelativeToParent:
              StepLocationRelativeToParent.INSIDE_BRANCH as const,
            drawHorizontalLine:
              branchIndex === 0 ||
              branchIndex === childGraphsAfterOffset.length - 1,
            drawStartingVerticalLine: branchIndex === 0,
          },
        },
        {
          id: `${step.name}-branch-${branchIndex}-end-edge`,
          source: `${childGraph.nodes.at(-1)!.id}`,
          target: subgraphEndSubNode.id,
          type: ApEdgeType.ROUTER_END_EDGE as const,
          data: {
            drawEndingVerticalLine: branchIndex === 0,
            verticalSpaceBetweenLastNodeInBranchAndEndLine:
              subgraphEndSubNode.position.y -
              childGraph.nodes.at(-1)!.position.y -
              flowUtilConsts.VERTICAL_SPACE_BETWEEN_STEPS -
              flowUtilConsts.ARC_LENGTH,
            drawHorizontalLine:
              branchIndex === 0 ||
              branchIndex === childGraphsAfterOffset.length - 1,
            routerOrBranchStepName: step.name,
            isNextStepEmpty: isNil(step.nextAction),
          },
        },
      ];
    })
    .flat();

  return {
    nodes: [
      ...childGraphsAfterOffset.map((cg) => cg.nodes).flat(),
      subgraphEndSubNode,
    ],
    edges: [...childGraphsAfterOffset.map((cg) => cg.edges).flat(), ...edges],
  };
};

const offsetRouterChildSteps = (childGraphs: ApGraph[]) => {
  const childGraphsBoundingBoxes = childGraphs.map((childGraph) =>
    calculateGraphBoundingBox(childGraph),
  );
  const totalWidth =
    childGraphsBoundingBoxes.reduce((acc, current) => acc + current.width, 0) +
    flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES * (childGraphs.length - 1);
  let deltaLeftX =
    -(
      totalWidth -
      childGraphsBoundingBoxes[0].left -
      childGraphsBoundingBoxes[childGraphs.length - 1].right
    ) /
      2 -
    childGraphsBoundingBoxes[0].left;

  return childGraphsBoundingBoxes.map((childGraphBoundingBox, index) => {
    const x = deltaLeftX + childGraphBoundingBox.left;
    deltaLeftX +=
      childGraphBoundingBox.width +
      flowUtilConsts.HORIZONTAL_SPACE_BETWEEN_NODES;
    return offsetGraph(childGraphs[index], {
      x,
      y:
        flowUtilConsts.AP_NODE_SIZE.STEP.height +
        flowUtilConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD,
    });
  });
};

export const flowCanvasUtils = {
  convertFlowVersionToGraph(version: FlowVersion): ApGraph {
    const graph = buildGraph(version.trigger);
    const graphEndWidget = graph.nodes.findLast(
      (node) => node.type === ApNodeType.GRAPH_END_WIDGET,
    ) as ApGraphEndNode;
    if (graphEndWidget) {
      graphEndWidget.data.showWidget = true;
    } else {
      console.warn('Flow end widget not found');
    }
    return graph;
  },
  createFocusStepInGraphParams,
  calculateGraphBoundingBox,
};
