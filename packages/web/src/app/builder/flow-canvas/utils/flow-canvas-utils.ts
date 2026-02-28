import {
  FlowActionKind,
  FlowOperationType,
  FlowRun,
  flowStructureUtil,
  FlowVersion,
  isNil,
  StepLocationRelativeToParent,
  FlowTriggerKind,
  Note,
  FlowNodeData,
  FlowGraphNode,
  BranchEdge,
} from '@activepieces/shared';
import { t } from 'i18next';

import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';

import { flowCanvasConsts } from './consts';
import {
  ApBigAddButtonNode,
  ApButtonData,
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
  parentStepName: string,
  nodeData: ApBigAddButtonNode['data'],
) => ApGraph = (parentStepName, nodeData) => {
  const bigAddButtonNode: ApBigAddButtonNode = {
    id: `${parentStepName}-big-add-button-${nodeData.edgeId}`,
    type: ApNodeType.BIG_ADD_BUTTON,
    position: { x: 0, y: 0 },
    data: nodeData,
    selectable: false,
    style: {
      pointerEvents: 'all',
    },
  };
  const graphEndNode: ApGraphEndNode = {
    id: `${parentStepName}-subgraph-end-${nodeData.edgeId}`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };

  const straightLineEdge: ApStraightLineEdge = {
    id: `big-button-straight-line-for${nodeData.edgeId}`,
    source: `${parentStepName}-big-add-button-${nodeData.edgeId}`,
    target: `${parentStepName}-subgraph-end-${nodeData.edgeId}`,
    type: ApEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: false,
      hideAddButton: true,
      parentStepName,
    },
  };
  return {
    nodes: [bigAddButtonNode, graphEndNode],
    edges: [straightLineEdge],
  };
};

const createStepGraph: (
  stepData: FlowNodeData,
  graphHeight: number,
  nextStepName: string | undefined,
) => ApGraph = (stepData, graphHeight, nextStepName) => {
  const stepNode: ApStepNode = {
    id: stepData.name,
    type: ApNodeType.STEP as const,
    position: { x: 0, y: 0 },
    data: {
      step: stepData,
    },
    selectable: stepData.name !== 'trigger',
    draggable: true,
    style: {
      pointerEvents: 'all',
    },
  };

  const graphEndNode: ApGraphEndNode = {
    id: `${stepData.name}-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y: graphHeight,
    },
    data: {},
    selectable: false,
  };

  const straightLineEdge: ApStraightLineEdge = {
    id: `${stepData.name}-${nextStepName ?? 'graph-end'}-edge`,
    source: stepData.name,
    target: `${stepData.name}-subgraph-end`,
    type: ApEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: !isNil(nextStepName),
      parentStepName: stepData.name,
    },
  };
  return {
    nodes: [stepNode, graphEndNode],
    edges:
      stepData.kind !== FlowActionKind.LOOP_ON_ITEMS &&
      stepData.kind !== FlowActionKind.ROUTER
        ? [straightLineEdge]
        : [],
  };
};

const buildChainGraph: (
  stepNames: string[],
  flowVersion: FlowVersion,
) => ApGraph = (stepNames, flowVersion) => {
  if (stepNames.length === 0) {
    return { nodes: [], edges: [] };
  }

  const stepName = stepNames[0];
  const node = flowVersion.graph.nodes.find((n) => n.id === stepName);
  if (!node) {
    return { nodes: [], edges: [] };
  }

  const nextStepName = stepNames.length > 1 ? stepNames[1] : undefined;
  const hasNextStep = stepNames.length > 1;

  const graph: ApGraph = createStepGraph(
    node.data,
    flowCanvasConsts.AP_NODE_SIZE.STEP.height +
      flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    nextStepName,
  );
  const childGraph =
    node.data.kind === FlowActionKind.LOOP_ON_ITEMS
      ? buildLoopChildGraph(node, flowVersion, hasNextStep)
      : node.data.kind === FlowActionKind.ROUTER
      ? buildRouterChildGraph(node, flowVersion, hasNextStep)
      : null;

  const graphWithChild = childGraph ? mergeGraph(graph, childGraph) : graph;
  const restGraph = buildChainGraph(stepNames.slice(1), flowVersion);
  return mergeGraph(
    graphWithChild,
    offsetGraph(restGraph, {
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
      zIndex: 50,
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      zIndex: 50,
    })),
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
      .filter((node) => flowCanvasConsts.doesNodeAffectBoundingBox(node.type))
      .map((node) => node.position.x),
  );
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes
      .filter((node) => flowCanvasConsts.doesNodeAffectBoundingBox(node.type))
      .map(
        (node) => node.position.x + flowCanvasConsts.AP_NODE_SIZE.STEP.width,
      ),
  );
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    width,
    height,
    left: -minX + flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
    right: maxX - flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
    top: minY,
    bottom: maxY,
  };
};

const buildLoopChildGraph = (
  node: FlowGraphNode,
  flowVersion: FlowVersion,
  hasNextStep: boolean,
): ApGraph => {
  const loopEdge = flowStructureUtil.getLoopEdge(flowVersion.graph, node.id);
  const childStepNames =
    loopEdge && loopEdge.target
      ? flowStructureUtil.getDefaultChain(flowVersion.graph, loopEdge.target)
      : [];
  const hasChildren = childStepNames.length > 0;
  const childGraph = hasChildren
    ? buildChainGraph(childStepNames, flowVersion)
    : createBigAddButtonGraph(node.id, {
        parentStepName: node.id,
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        edgeId: `${node.id}-loop-start-edge`,
      });

  const childGraphBoundingBox = calculateGraphBoundingBox(childGraph);
  const deltaLeftX =
    -(
      childGraphBoundingBox.width +
      flowCanvasConsts.AP_NODE_SIZE.STEP.width +
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES -
      flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2 -
      childGraphBoundingBox.right
    ) /
      2 -
    flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2;

  const loopReturnNode: ApLoopReturnNode = {
    id: `${node.id}-loop-return-node`,
    type: ApNodeType.LOOP_RETURN_NODE,
    position: {
      x: deltaLeftX + flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height / 2,
    },
    data: {},
    selectable: false,
  };
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x:
      deltaLeftX +
      flowCanvasConsts.AP_NODE_SIZE.STEP.width +
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES +
      childGraphBoundingBox.left,
    y:
      flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
      flowCanvasConsts.AP_NODE_SIZE.STEP.height,
  });
  const edges: ApEdge[] = [
    {
      id: `${node.id}-loop-start-edge`,
      source: node.id,
      target: `${childGraph.nodes[0].id}`,
      type: ApEdgeType.LOOP_START_EDGE as const,
      data: {
        isLoopEmpty: !hasChildren,
      },
    },
    {
      id: `${node.id}-loop-return-node`,
      source: `${childGraph.nodes[childGraph.nodes.length - 1].id}`,
      target: `${node.id}-loop-return-node`,
      type: ApEdgeType.LOOP_RETURN_EDGE as const,
      data: {
        parentStepName: node.id,
        isLoopEmpty: !hasChildren,
        drawArrowHeadAfterEnd: hasNextStep,
        verticalSpaceBetweenReturnNodeStartAndEnd:
          childGraphBoundingBox.height +
          flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
      },
    },
  ];

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${node.id}-loop-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height +
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };

  return {
    nodes: [loopReturnNode, ...childGraphAfterOffset.nodes, subgraphEndSubNode],
    edges: [...edges, ...childGraphAfterOffset.edges],
  };
};

const buildRouterChildGraph = (
  node: FlowGraphNode,
  flowVersion: FlowVersion,
  hasNextStep: boolean,
) => {
  const branchEdges: BranchEdge[] = flowStructureUtil.getBranchEdges(
    flowVersion.graph,
    node.id,
  );
  const childGraphs = branchEdges.map((branchEdge, index) => {
    const branchStepNames = branchEdge.target
      ? flowStructureUtil.getDefaultChain(flowVersion.graph, branchEdge.target)
      : [];
    return branchStepNames.length > 0
      ? buildChainGraph(branchStepNames, flowVersion)
      : createBigAddButtonGraph(node.id, {
          parentStepName: node.id,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_BRANCH,
          branchIndex: index,
          edgeId: `${node.id}-branch-${index}-start-edge`,
        });
  });

  const childGraphsAfterOffset = offsetRouterChildSteps(childGraphs);

  const maxHeight = Math.max(
    ...childGraphsAfterOffset.map((cg) => calculateGraphBoundingBox(cg).height),
  );

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${node.id}-branch-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD +
        maxHeight +
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };
  const edges: ApEdge[] = childGraphsAfterOffset
    .map((childGraph, branchIndex) => {
      const branchEdge = branchEdges[branchIndex];
      const branchStepNames = branchEdge.target
        ? flowStructureUtil.getDefaultChain(
            flowVersion.graph,
            branchEdge.target,
          )
        : [];
      return [
        {
          id: `${node.id}-branch-${branchIndex}-start-edge`,
          source: node.id,
          target: `${childGraph.nodes[0].id}`,
          type: ApEdgeType.ROUTER_START_EDGE as const,
          data: {
            isBranchEmpty: branchStepNames.length === 0,
            label:
              branchEdge.branchName ??
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
          id: `${node.id}-branch-${branchIndex}-end-edge`,
          source: `${childGraph.nodes.at(-1)!.id}`,
          target: subgraphEndSubNode.id,
          type: ApEdgeType.ROUTER_END_EDGE as const,
          data: {
            drawEndingVerticalLine: branchIndex === 0,
            verticalSpaceBetweenLastNodeInBranchAndEndLine:
              subgraphEndSubNode.position.y -
              childGraph.nodes.at(-1)!.position.y -
              flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
              flowCanvasConsts.ARC_LENGTH,
            drawHorizontalLine:
              branchIndex === 0 ||
              branchIndex === childGraphsAfterOffset.length - 1,
            routerOrBranchStepName: node.id,
            isNextStepEmpty: !hasNextStep,
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
    flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES * (childGraphs.length - 1);
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
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES;
    return offsetGraph(childGraphs[index], {
      x,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD,
    });
  });
};

const createAddOperationFromAddButtonData = (data: ApButtonData) => {
  if (
    data.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
    return {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: {
        parentStep: data.parentStepName,
        stepLocationRelativeToParent: data.stepLocationRelativeToParent,
        branchIndex: data.branchIndex,
      },
    } as const;
  }
  return {
    type: FlowOperationType.ADD_ACTION,
    actionLocation: {
      parentStep: data.parentStepName,
      stepLocationRelativeToParent: data.stepLocationRelativeToParent,
    },
  } as const;
};

const isSkipped = (stepName: string, flowVersion: FlowVersion) => {
  const node = flowStructureUtil.getStep(stepName, flowVersion);
  if (
    isNil(node) ||
    node.data.kind === FlowTriggerKind.EMPTY ||
    node.data.kind === FlowTriggerKind.PIECE
  ) {
    return false;
  }
  const skippedParents = flowStructureUtil
    .findPathToStep(flowVersion, stepName)
    .filter(
      (stepInPath) =>
        stepInPath.data.kind === FlowActionKind.LOOP_ON_ITEMS ||
        stepInPath.data.kind === FlowActionKind.ROUTER,
    )
    .filter((routerOrLoop) =>
      flowStructureUtil.isChildOf(routerOrLoop, stepName, flowVersion),
    )
    .filter((parent) => 'skip' in parent.data && parent.data.skip);

  return skippedParents.length > 0 || ('skip' in node.data && !!node.data.skip);
};

const getStepStatus = (
  stepName: string | undefined,
  run: FlowRun | null,
  loopIndexes: Record<string, number>,
  flowVersion: FlowVersion,
) => {
  if (isNil(run) || isNil(stepName) || isNil(run.steps)) {
    return undefined;
  }
  const stepOutput = flowRunUtils.extractStepOutput(
    stepName,
    loopIndexes,
    run.steps,
  );
  return stepOutput?.status;
};
function buildNotesGraph(notes: Note[]): ApGraph {
  return {
    nodes: notes.map((note) => ({
      id: note.id,
      type: ApNodeType.NOTE,
      draggable: true,
      position: note.position,
      data: {
        content: note.content,
        creatorId: note.ownerId,
        color: note.color,
        size: note.size,
      },
    })),
    edges: [],
  };
}

function determineInitiallySelectedStep(
  failedStepNameInRun: string | null,
  flowVersion: FlowVersion,
): string | null {
  const firstInvalidStep = flowStructureUtil
    .getAllSteps(flowVersion)
    .find((s) => !s.data.valid);
  const isNewFlow = window.location.search.includes(NEW_FLOW_QUERY_PARAM);
  if (failedStepNameInRun) {
    return failedStepNameInRun;
  }
  if (isNewFlow) {
    return null;
  }
  return firstInvalidStep?.id ?? 'trigger';
}
const doesSelectionRectangleExist = () => {
  return (
    document.querySelector(
      `.${flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME}`,
    ) !== null
  );
};
export const flowCanvasUtils = {
  createFlowGraph(version: FlowVersion, notes: Note[]): ApGraph {
    const triggerNode = flowStructureUtil.getTriggerNode(version.graph);
    if (!triggerNode) {
      return buildNotesGraph(notes);
    }
    const successorEdge = flowStructureUtil.getSuccessorEdge(
      version.graph,
      triggerNode.id,
    );
    const chainStepNames =
      successorEdge && successorEdge.target
        ? flowStructureUtil.getDefaultChain(version.graph, successorEdge.target)
        : [];
    const hasNextStep = chainStepNames.length > 0;
    const nextStepName = hasNextStep ? chainStepNames[0] : undefined;
    const triggerGraph = createStepGraph(
      triggerNode.data,
      flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
      nextStepName,
    );
    const chainGraph = buildChainGraph(chainStepNames, version);
    const stepsGraph = mergeGraph(
      triggerGraph,
      offsetGraph(chainGraph, {
        x: 0,
        y: calculateGraphBoundingBox(triggerGraph).height,
      }),
    );
    const notesGraph = buildNotesGraph(notes);
    const graphEndWidget = stepsGraph.nodes.findLast(
      (node) => node.type === ApNodeType.GRAPH_END_WIDGET,
    ) as ApGraphEndNode;
    if (graphEndWidget) {
      graphEndWidget.data.showWidget = true;
    } else {
      console.warn('Flow end widget not found');
    }
    return mergeGraph(stepsGraph, notesGraph);
  },
  createFocusStepInGraphParams,
  calculateGraphBoundingBox,
  createAddOperationFromAddButtonData,
  isSkipped,
  getStepStatus,
  determineInitiallySelectedStep,
  doesSelectionRectangleExist,
};
