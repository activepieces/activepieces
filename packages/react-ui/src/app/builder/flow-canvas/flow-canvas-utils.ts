import { nanoid } from 'nanoid';

import {
  Action,
  ActionType,
  FlowVersion,
  StepLocationRelativeToParent,
  Trigger,
  assertNotNullOrUndefined,
  isNil,
} from '@activepieces/shared';

const VERTICAL_OFFSET = 160;
const HORIZONTAL_SPACE_BETWEEN_NODES = 80;
export const DRAGGED_STEP_TAG = 'dragged-step';

export enum ApNodeType {
  LOOP_PLACEHOLDER = 'loopPlaceholder',
  PLACEHOLDER = 'placeholder',
  BIG_BUTTON = 'bigButton',
  STEP_NODE = 'stepNode',
  SMALL_BUTTON = 'smallButton',
}

export const AP_NODE_SIZE: Record<
  ApNodeType,
  { height: number; width: number }
> = {
  [ApNodeType.BIG_BUTTON]: {
    height: 70,
    width: 260,
  },
  [ApNodeType.STEP_NODE]: {
    height: 70,
    width: 260,
  },
  [ApNodeType.PLACEHOLDER]: {
    height: 5,
    width: 260,
  },
  [ApNodeType.LOOP_PLACEHOLDER]: {
    height: 70,
    width: 260,
  },
  [ApNodeType.SMALL_BUTTON]: {
    height: 18,
    width: 18,
  },
};

export const flowCanvasUtils = {
  isPlaceHolder,
  convertFlowVersionToGraph(version: FlowVersion): ApGraph {
    return traverseFlow(version.trigger);
  },
  createFocusStepInGraphParams,
};

function traverseFlow(step: Action | Trigger | undefined): ApGraph {
  if (isNil(step)) {
    return buildGraph(ApNodeType.PLACEHOLDER);
  }
  const graph: ApGraph = buildGraph(ApNodeType.STEP_NODE, step);
  switch (step.type) {
    case ActionType.LOOP_ON_ITEMS: {
      const { firstLoopAction, nextAction } = step;
      const firstLoopGraph = isNil(firstLoopAction)
        ? buildBigButton(step.name, StepLocationRelativeToParent.INSIDE_LOOP)
        : traverseFlow(firstLoopAction);
      const childrenGraphs = [
        buildGraph(ApNodeType.LOOP_PLACEHOLDER),
        firstLoopGraph,
      ];

      return buildChildrenGraph(
        childrenGraphs,
        [
          StepLocationRelativeToParent.INSIDE_LOOP,
          StepLocationRelativeToParent.INSIDE_LOOP,
        ],
        nextAction,
        graph,
        step.name,
      );
    }
    case ActionType.BRANCH: {
      const { nextAction, onSuccessAction, onFailureAction } = step;

      const childrenGraphs = [onSuccessAction, onFailureAction].map(
        (childGraph, index) => {
          return isNil(childGraph)
            ? buildBigButton(
                step.name,
                index === 0
                  ? StepLocationRelativeToParent.INSIDE_TRUE_BRANCH
                  : StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
              )
            : traverseFlow(childGraph);
        },
      );

      return buildChildrenGraph(
        childrenGraphs,
        [
          StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
          StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
        ],
        nextAction,
        graph,
        step.name,
      );
    }
    default: {
      const { nextAction } = step;
      const childGraph = offsetGraph(traverseFlow(nextAction), {
        x: 0,
        y: VERTICAL_OFFSET,
      });
      const stepName = graph.nodes[0].data.step?.name;
      assertNotNullOrUndefined(
        stepName,
        'stepName for first node in graph should be defined',
      );
      graph.edges.push(
        addEdge(
          graph.nodes[0],
          childGraph.nodes[0],
          StepLocationRelativeToParent.AFTER,
          stepName,
        ),
      );
      return mergeGraph(graph, childGraph);
    }
  }
}

function buildChildrenGraph(
  childrenGraphs: ApGraph[],
  locations: StepLocationRelativeToParent[],
  nextAction: Action | Trigger | undefined,
  graph: ApGraph,
  parentStep: string,
): ApGraph {
  const totalWidth =
    (childrenGraphs.length - 1) * HORIZONTAL_SPACE_BETWEEN_NODES +
    childrenGraphs.reduce(
      (acc, current) => boundingBox(current).width + acc,
      0,
    );
  const maximumHeight =
    childrenGraphs.reduce(
      (acc, current) => Math.max(acc, boundingBox(current).height),
      0,
    ) +
    2 * VERTICAL_OFFSET;

  const commonPartGraph = offsetGraph(
    isNil(nextAction)
      ? buildGraph(ApNodeType.PLACEHOLDER)
      : traverseFlow(nextAction),
    {
      x: 0,
      y: maximumHeight,
    },
  );

  let deltaLeftX =
    -(
      totalWidth -
      boundingBox(childrenGraphs[0]).widthLeft -
      boundingBox(childrenGraphs[childrenGraphs.length - 1]).widthRight
    ) /
      2 -
    boundingBox(childrenGraphs[0]).widthLeft;

  childrenGraphs.forEach((childGraph, idx) => {
    const cbx = boundingBox(childGraph);
    graph.edges.push(
      addEdge(graph.nodes[0], childGraph.nodes[0], locations[idx], parentStep),
    );
    const childGraphAfterOffset = offsetGraph(childGraph, {
      x: deltaLeftX + cbx.widthLeft,
      y: VERTICAL_OFFSET,
    });
    graph = mergeGraph(graph, childGraphAfterOffset);
    const rootStepName = graph.nodes[0].data.step?.name;
    assertNotNullOrUndefined(rootStepName, 'rootStepName should be defined');
    graph.edges.push(
      addEdge(
        childGraphAfterOffset.nodes[childGraphAfterOffset.nodes.length - 1],
        commonPartGraph.nodes[0],
        StepLocationRelativeToParent.AFTER,
        rootStepName,
      ),
    );
    deltaLeftX += cbx.width + HORIZONTAL_SPACE_BETWEEN_NODES;
  });
  graph = mergeGraph(graph, commonPartGraph);
  return graph;
}

function addEdge(
  nodeOne: ApNode,
  nodeTwo: ApNode,
  stepLocationRelativeToParent: StepLocationRelativeToParent,
  parentStep: string,
): ApEdge {
  return {
    id: `${nodeOne.id}-${nodeTwo.id}`,
    source: nodeOne.id,
    target: nodeTwo.id,
    focusable: false,
    type:
      nodeTwo.type === ApNodeType.LOOP_PLACEHOLDER ? 'apReturnEdge' : 'apEdge',
    label: nodeTwo.id,
    data: {
      parentStep: parentStep,
      stepLocationRelativeToParent,
      addButton: nodeTwo.type !== ApNodeType.BIG_BUTTON,
      targetType: nodeTwo.type,
    },
  };
}

function isPlaceHolder(type: ApNodeType): boolean {
  return [ApNodeType.PLACEHOLDER, ApNodeType.LOOP_PLACEHOLDER].includes(type);
}

function boundingBox(graph: ApGraph): ApBoundingBox {
  const minX = Math.min(...graph.nodes.map((node) => node.position.x));
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes.map(
      (node) => node.position.x + AP_NODE_SIZE[node.type].width,
    ),
  );
  const maxY = Math.max(
    ...graph.nodes.map(
      (node) => node.position.y + AP_NODE_SIZE[node.type].height,
    ),
  );
  const width = maxX - minX;
  const height = maxY - minY;
  const widthLeft = -minX + AP_NODE_SIZE[graph.nodes[0].type].width / 2;
  const widthRight = maxX - AP_NODE_SIZE[graph.nodes[0].type].width / 2;
  return { width, height, widthLeft, widthRight };
}

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

function buildBigButton(
  parentStep: string,
  stepLocationRelativeToParent?: StepLocationRelativeToParent,
): ApGraph {
  return {
    nodes: [
      {
        id: nanoid(),
        position: { x: 0, y: 0 },
        type: ApNodeType.BIG_BUTTON,
        data: {
          parentStep,
          stepLocationRelativeToParent,
        },
      },
    ],
    edges: [],
  };
}

function buildGraph(type: ApNodeType, step?: Step): ApGraph {
  return {
    nodes: [
      {
        id: step?.name ?? nanoid(),
        position: { x: 0, y: 0 },
        type,
        data: {
          step,
        },
      },
    ],
    edges: [],
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

type Step = Action | Trigger;

type ApBoundingBox = {
  width: number;
  height: number;
  widthLeft: number;
  widthRight: number;
};

export type ApNode = {
  id: string;
  position: { x: number; y: number };
  type: ApNodeType;
  data: {
    step?: Step;
    parentStep?: string;
    stepLocationRelativeToParent?: StepLocationRelativeToParent;
  };
};

export type ApEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  focusable: false;
  label: string;
  data: {
    addButton: boolean;
    targetType: ApNodeType;
    stepLocationRelativeToParent: StepLocationRelativeToParent;
    parentStep?: string;
  };
};

export type ApGraph = {
  nodes: ApNode[];
  edges: ApEdge[];
};
