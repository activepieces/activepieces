import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowRun,
  flowCanvasUtils as sharedFlowCanvasUtils,
  flowStructureUtil,
  FlowVersion,
  isNil,
  LoopOnItemsAction,
  RouterAction,
  StepLocationRelativeToParent,
  FlowTrigger,
  FlowTriggerType,
  Note,
} from '@activepieces/shared';
import { t } from 'i18next';

import { flowRunUtils } from '@/features/flow-runs';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';

import { flowCanvasLayoutConsts } from './layout-consts';
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
  CanvasOrientation,
} from './types';

/**
 * How the horizontal canvas works: the graph is always built in "layout
 * space", the coordinate system of the vertical canvas, where y advances along
 * the flow and x spreads branches side by side. The only orientation-specific
 * inputs are the node sizes and gaps from ORIENTATION_LAYOUT (horizontal steps
 * are compact squares). For the horizontal canvas the finished graph is then
 * reflected across the y = x axis — node positions by transposeGraphPositions
 * below, edge SVG paths by svgPathUtils.transposePath inside the edge
 * components — turning the top-to-bottom layout into a left-to-right one.
 */
const getLayout = (orientation: CanvasOrientation) =>
  flowCanvasLayoutConsts.ORIENTATION_LAYOUT[orientation];

const createBigAddButtonGraph: (params: {
  parentStep: FlowAction;
  nodeData: ApBigAddButtonNode['data'];
  orientation: CanvasOrientation;
}) => ApGraph = ({ parentStep, nodeData, orientation }) => {
  const layout = getLayout(orientation);
  const bigAddButtonNode: ApBigAddButtonNode = {
    id: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    type: ApNodeType.BIG_ADD_BUTTON,
    position: { x: 0, y: 0 },
    data: nodeData,
    selectable: false,
    style: {
      pointerEvents: 'all',
    },
  };
  const graphEndNode: ApGraphEndNode = {
    id: `${parentStep.name}-subgraph-end-${nodeData.edgeId}`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: layout.stepCrossSize / 2,
      y: layout.stepAlongSize + layout.spaceAlongBetweenSteps,
    },
    data: {},
    selectable: false,
  };

  const straightLineEdge: ApStraightLineEdge = {
    id: `big-button-straight-line-for${nodeData.edgeId}`,
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

const createStepGraph: (params: {
  step: FlowAction | FlowTrigger;
  graphAlongSize: number;
  orientation: CanvasOrientation;
}) => ApGraph = ({ step, graphAlongSize, orientation }) => {
  const layout = getLayout(orientation);
  const stepNode: ApStepNode = {
    id: step.name,
    type: ApNodeType.STEP as const,
    position: { x: 0, y: 0 },
    data: {
      step,
    },
    selectable: step.name !== 'trigger',
    draggable: true,
    style: {
      pointerEvents: 'all',
    },
  };

  const graphEndNode: ApGraphEndNode = {
    id: `${step.name}-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: layout.stepCrossSize / 2,
      y: graphAlongSize,
    },
    data: {},
    selectable: false,
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
      step.type !== FlowActionType.LOOP_ON_ITEMS &&
      step.type !== FlowActionType.ROUTER &&
      !sharedFlowCanvasUtils.hasContinueOnFailureBranches(step)
        ? [straightLineEdge]
        : [],
  };
};

const buildFlowGraph: (params: {
  step: FlowAction | FlowTrigger | undefined;
  orientation: CanvasOrientation;
}) => ApGraph = ({ step, orientation }) => {
  if (isNil(step)) {
    return {
      nodes: [],
      edges: [],
    };
  }
  const layout = getLayout(orientation);
  const graph: ApGraph = createStepGraph({
    step,
    graphAlongSize: layout.stepAlongSize + layout.spaceAlongBetweenSteps,
    orientation,
  });
  const childGraph =
    step.type === FlowActionType.LOOP_ON_ITEMS
      ? buildLoopChildGraph({ step, orientation })
      : step.type === FlowActionType.ROUTER
      ? buildRouterChildGraph({ step, orientation })
      : sharedFlowCanvasUtils.hasContinueOnFailureBranches(step)
      ? buildContinueOnFailureBranchesGraph({ step, orientation })
      : null;

  const graphWithChild = childGraph ? mergeGraph(graph, childGraph) : graph;
  const nextStepGraph = buildFlowGraph({
    step: step.nextAction,
    orientation,
  });
  return mergeGraph(
    graphWithChild,
    offsetGraph(nextStepGraph, {
      x: 0,
      y: calculateGraphBoundingBox({ graph: graphWithChild, orientation })
        .height,
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

function transposeGraphPositions(graph: ApGraph): ApGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.y,
        y: node.position.x,
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

const calculateGraphBoundingBox = ({
  graph,
  orientation,
}: {
  graph: ApGraph;
  orientation: CanvasOrientation;
}) => {
  const layout = getLayout(orientation);
  const minX = Math.min(
    ...graph.nodes
      .filter((node) =>
        flowCanvasLayoutConsts.doesNodeAffectBoundingBox(node.type),
      )
      .map((node) => node.position.x),
  );
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes
      .filter((node) =>
        flowCanvasLayoutConsts.doesNodeAffectBoundingBox(node.type),
      )
      .map((node) => node.position.x + layout.stepCrossSize),
  );
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    width,
    height,
    left: -minX + layout.stepCrossSize / 2,
    right: maxX - layout.stepCrossSize / 2,
    top: minY,
    bottom: maxY,
  };
};

const buildLoopChildGraph: (params: {
  step: LoopOnItemsAction;
  orientation: CanvasOrientation;
}) => ApGraph = ({ step, orientation }) => {
  const layout = getLayout(orientation);
  const childGraph = step.firstLoopAction
    ? buildFlowGraph({
        step: step.firstLoopAction,
        orientation,
      })
    : createBigAddButtonGraph({
        parentStep: step,
        nodeData: {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_LOOP,
          edgeId: `${step.name}-loop-start-edge`,
        },
        orientation,
      });

  const childGraphBoundingBox = calculateGraphBoundingBox({
    graph: childGraph,
    orientation,
  });
  const deltaLeftX =
    -(
      childGraphBoundingBox.width +
      layout.stepCrossSize +
      layout.crossGapBetweenBranches -
      layout.stepCrossSize / 2 -
      childGraphBoundingBox.right
    ) /
      2 -
    layout.stepCrossSize / 2;

  const loopReturnNode: ApLoopReturnNode = {
    id: `${step.name}-loop-return-node`,
    type: ApNodeType.LOOP_RETURN_NODE,
    position: {
      x: deltaLeftX + layout.stepCrossSize / 2,
      y:
        layout.stepAlongSize +
        layout.loopOffsetAlong +
        childGraphBoundingBox.height / 2,
    },
    data: {},
    selectable: false,
  };
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x:
      deltaLeftX +
      layout.stepCrossSize +
      layout.crossGapBetweenBranches +
      childGraphBoundingBox.left,
    y: layout.loopOffsetAlong + layout.stepAlongSize,
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
          childGraphBoundingBox.height + layout.spaceAlongBetweenSteps,
      },
    },
  ];

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${step.name}-loop-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: layout.stepCrossSize / 2,
      y:
        layout.stepAlongSize +
        layout.loopOffsetAlong +
        childGraphBoundingBox.height +
        flowCanvasLayoutConsts.ARC_LENGTH +
        layout.spaceAlongBetweenSteps,
    },
    data: {},
    selectable: false,
  };

  return {
    nodes: [loopReturnNode, ...childGraphAfterOffset.nodes, subgraphEndSubNode],
    edges: [...edges, ...childGraphAfterOffset.edges],
  };
};

const buildRouterChildGraph = ({
  step,
  orientation,
}: {
  step: RouterAction;
  orientation: CanvasOrientation;
}) => {
  const layout = getLayout(orientation);
  const childGraphs = step.children.map((branch, index) => {
    return branch
      ? buildFlowGraph({ step: branch, orientation })
      : createBigAddButtonGraph({
          parentStep: step,
          nodeData: {
            parentStepName: step.name,
            stepLocationRelativeToParent:
              StepLocationRelativeToParent.INSIDE_BRANCH,
            branchIndex: index,
            edgeId: `${step.name}-branch-${index}-start-edge`,
          },
          orientation,
        });
  });

  const childGraphsAfterOffset = offsetRouterChildSteps({
    childGraphs,
    orientation,
  });

  const maxHeight = Math.max(
    ...childGraphsAfterOffset.map(
      (cg) => calculateGraphBoundingBox({ graph: cg, orientation }).height,
    ),
  );

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${step.name}-branch-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: layout.stepCrossSize / 2,
      y:
        layout.stepAlongSize +
        layout.routerOffsetAlong +
        maxHeight +
        flowCanvasLayoutConsts.ARC_LENGTH +
        layout.spaceAlongBetweenSteps,
    },
    data: {},
    selectable: false,
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
              layout.spaceAlongBetweenSteps -
              flowCanvasLayoutConsts.ARC_LENGTH,
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

const buildContinueOnFailureBranchesGraph = ({
  step,
  orientation,
}: {
  step: FlowAction;
  orientation: CanvasOrientation;
}): ApGraph => {
  const layout = getLayout(orientation);
  const branches =
    step.type === FlowActionType.CODE || step.type === FlowActionType.PIECE
      ? step.continueOnFailureBranches
      : undefined;
  const branchOrder = [
    {
      branch: branches?.onSuccess,
      label: t('Success'),
      location: StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH as const,
    },
    {
      branch: branches?.onFailure,
      label: t('Failure'),
      location: StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH as const,
    },
  ];

  const childGraphs = branchOrder.map(({ branch, location }, index) =>
    branch
      ? buildFlowGraph({ step: branch, orientation })
      : createBigAddButtonGraph({
          parentStep: step,
          nodeData: {
            parentStepName: step.name,
            stepLocationRelativeToParent: location,
            edgeId: `${step.name}-cof-branch-${index}-start-edge`,
          },
          orientation,
        }),
  );

  const childGraphsAfterOffset = offsetRouterChildSteps({
    childGraphs,
    orientation,
  });

  const maxHeight = Math.max(
    ...childGraphsAfterOffset.map(
      (cg) => calculateGraphBoundingBox({ graph: cg, orientation }).height,
    ),
  );

  const subgraphEndSubNode: ApGraphEndNode = {
    id: `${step.name}-cof-subgraph-end`,
    type: ApNodeType.GRAPH_END_WIDGET,
    position: {
      x: layout.stepCrossSize / 2,
      y:
        layout.stepAlongSize +
        layout.routerOffsetAlong +
        maxHeight +
        flowCanvasLayoutConsts.ARC_LENGTH +
        layout.spaceAlongBetweenSteps,
    },
    data: {},
    selectable: false,
  };

  const edges: ApEdge[] = childGraphsAfterOffset
    .map((childGraph, branchIndex) => {
      const { label, location, branch } = branchOrder[branchIndex];
      return [
        {
          id: `${step.name}-cof-branch-${branchIndex}-start-edge`,
          source: step.name,
          target: `${childGraph.nodes[0].id}`,
          type: ApEdgeType.ROUTER_START_EDGE as const,
          data: {
            isBranchEmpty: isNil(branch),
            label,
            stepLocationRelativeToParent: location,
            drawHorizontalLine: true,
            drawStartingVerticalLine: branchIndex === 0,
          },
        },
        {
          id: `${step.name}-cof-branch-${branchIndex}-end-edge`,
          source: `${childGraph.nodes.at(-1)!.id}`,
          target: subgraphEndSubNode.id,
          type: ApEdgeType.ROUTER_END_EDGE as const,
          data: {
            drawEndingVerticalLine: branchIndex === 0,
            verticalSpaceBetweenLastNodeInBranchAndEndLine:
              subgraphEndSubNode.position.y -
              childGraph.nodes.at(-1)!.position.y -
              layout.spaceAlongBetweenSteps -
              flowCanvasLayoutConsts.ARC_LENGTH,
            drawHorizontalLine: true,
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

const offsetRouterChildSteps = ({
  childGraphs,
  orientation,
}: {
  childGraphs: ApGraph[];
  orientation: CanvasOrientation;
}) => {
  const layout = getLayout(orientation);
  const boundingBoxes = childGraphs.map((g) =>
    calculateGraphBoundingBox({ graph: g, orientation }),
  );
  const offsets = sharedFlowCanvasUtils.computeRouterChildOffsets(
    boundingBoxes,
    layout.routerBranchGap,
  );
  return childGraphs.map((g, i) =>
    offsetGraph(g, {
      x: offsets[i],
      y: layout.stepAlongSize + layout.routerOffsetAlong,
    }),
  );
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

const isSkipped = (stepName: string, trigger: FlowTrigger) => {
  const step = flowStructureUtil.getStep(stepName, trigger);
  if (
    isNil(step) ||
    step.type === FlowTriggerType.EMPTY ||
    step.type === FlowTriggerType.PIECE
  ) {
    return false;
  }
  const skippedParents = flowStructureUtil
    .findPathToStep(trigger, stepName)
    .filter(
      (stepInPath) =>
        stepInPath.type === FlowActionType.LOOP_ON_ITEMS ||
        stepInPath.type === FlowActionType.ROUTER ||
        sharedFlowCanvasUtils.hasContinueOnFailureBranches(stepInPath),
    )
    .filter((parentInPath) =>
      flowStructureUtil.isChildOf(parentInPath, stepName),
    )
    .filter((parent) => parent.skip);

  return skippedParents.length > 0 || !!step.skip;
};

const getStepStatus = (
  stepName: string | undefined,
  run: FlowRun | null,
  loopIndexes: Record<string, number>,
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
    .getAllSteps(flowVersion.trigger)
    .find((s) => !s.valid);
  const isNewFlow = window.location.search.includes(NEW_FLOW_QUERY_PARAM);
  if (failedStepNameInRun) {
    return failedStepNameInRun;
  }
  if (isNewFlow) {
    return null;
  }
  return firstInvalidStep?.name ?? 'trigger';
}
const doesSelectionRectangleExist = () => {
  return (
    document.querySelector(
      `.${flowCanvasLayoutConsts.NODE_SELECTION_RECT_CLASS_NAME}`,
    ) !== null
  );
};
export const flowCanvasUtils = {
  createFlowGraph({
    version,
    notes,
    orientation,
  }: {
    version: FlowVersion;
    notes: Note[];
    orientation: CanvasOrientation;
  }): ApGraph {
    const stepsGraph = buildFlowGraph({
      step: version.trigger,
      orientation,
    });
    const notesGraph = buildNotesGraph(notes);
    const graphEndWidget = stepsGraph.nodes.findLast(
      (node) => node.type === ApNodeType.GRAPH_END_WIDGET,
    ) as ApGraphEndNode;
    if (graphEndWidget) {
      graphEndWidget.data.showWidget = true;
    } else {
      console.warn('Flow end widget not found');
    }
    const orientedGraph =
      orientation === 'horizontal'
        ? transposeGraphPositions(stepsGraph)
        : stepsGraph;
    return mergeGraph(orientedGraph, notesGraph);
  },
  createFocusStepInGraphParams,
  calculateGraphBoundingBox,
  createAddOperationFromAddButtonData,
  isSkipped,
  getStepStatus,
  determineInitiallySelectedStep,
  doesSelectionRectangleExist,
};
