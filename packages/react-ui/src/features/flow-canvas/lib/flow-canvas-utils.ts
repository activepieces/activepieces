import { nanoid } from 'nanoid';
import {
  Action,
  ActionType,
  FlowVersion,
  Trigger,
  isNil,
} from '@activepieces/shared';

const VERTICAL_OFFSET = 150;
const HORIZONTAL_SPACE_BETWEEN_NODES = 30;
const NODE_SIZE = {
  width: 260,
  height: 70,
};

export const flowCanvasUtils = {
  convertFlowVersionToGraph(version: FlowVersion): ApGraph {
    return traverseFlow(version.trigger);
  },
};

function traverseFlow(step: Action | Trigger | undefined): ApGraph {
  if (isNil(step)) {
    return {
      nodes: [],
      edges: [],
    };
  }
  const graph: ApGraph = {
    nodes: [stepToNode(step)],
    edges: [],
  };
  switch (step.type) {
    case ActionType.LOOP_ON_ITEMS: {
      const { firstLoopAction, nextAction } = step;
      const childrenGraphs = [null, firstLoopAction].map((g) => {
        return isNil(g) ? graphWithSingleBigButton() : traverseFlow(g);
      });
      return buildChildrenGraph(childrenGraphs, nextAction, graph);
    }
    case ActionType.BRANCH: {
      const { nextAction, onSuccessAction, onFailureAction } = step;

      const childrenGraphs = [onSuccessAction, onFailureAction].map((g) => {
        return isNil(g) ? graphWithSingleBigButton() : traverseFlow(g);
      });

      return buildChildrenGraph(childrenGraphs, nextAction, graph);
    }
    default: {
      const { nextAction } = step;
      if (isNil(nextAction)) {
        return graph;
      }
      const childGraph = offsetGraph(traverseFlow(nextAction), {
        x: 0,
        y: VERTICAL_OFFSET,
      });
      graph.edges.push(addEdge(stepToNode(step), childGraph.nodes[0]));
      return mergeGraph(graph, childGraph);
    }
  }
}

function buildChildrenGraph(
  childrenGraphs: ApGraph[],
  nextAction: Action | Trigger | undefined,
  graph: ApGraph,
): ApGraph {
  const totalWidth =
    (childrenGraphs.length - 1) * HORIZONTAL_SPACE_BETWEEN_NODES +
    childrenGraphs.reduce(
      (acc, current) => boundingBox(current).width + acc,
      0,
    );
  const maximumHeight =
    childrenGraphs.reduce((acc, current) => boundingBox(current).height, 0) +
    2 * VERTICAL_OFFSET;

  const commonPartGraph = offsetGraph(isNil(nextAction) ? graphWithSingleBigButton() : traverseFlow(nextAction), {
    x: 0,
    y: maximumHeight
  })
  );

  let deltaLeftX =
    -(
      totalWidth -
      boundingBox(childrenGraphs[0]).widthLeft -
      boundingBox(childrenGraphs[childrenGraphs.length - 1]).widthRight
    ) /
      2 -
    boundingBox(childrenGraphs[0]).widthLeft;

  for (let idx = 0; idx < childrenGraphs.length; ++idx) {
    const cbx = boundingBox(childrenGraphs[idx]);
    graph.edges.push(addEdge(graph.nodes[0], childrenGraphs[idx].nodes[0]));
    const childGraph = offsetGraph(childrenGraphs[idx], {
      x: deltaLeftX + cbx.widthLeft,
      y: VERTICAL_OFFSET,
    });
    graph = mergeGraph(graph, childGraph);
    graph.edges.push(
      addEdge(
        childGraph.nodes[childGraph.nodes.length - 1],
        commonPartGraph.nodes[0],
      ),
    );
    deltaLeftX += cbx.width + HORIZONTAL_SPACE_BETWEEN_NODES;
  }
  graph = mergeGraph(graph, commonPartGraph);
  return graph;
}

function addEdge(nodeOne: ApNode, nodeTwo: ApNode): ApEdge {
  return {
    id: `${nodeOne.id}-${nodeTwo.id}`,
    source: nodeOne.id,
    target: nodeTwo.id,
    type: 'apEdge',
    label: nodeTwo.id,
  };
}

function boundingBox(graph: ApGraph): ApBoundingBox {
  const minX = Math.min(...graph.nodes.map((node) => node.position.x));
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes.map((node) => node.position.x + NODE_SIZE.width),
  );
  const maxY = Math.max(
    ...graph.nodes.map((node) => node.position.y + NODE_SIZE.height),
  );
  const width = maxX - minX;
  const height = maxY - minY;
  const widthLeft = -minX + NODE_SIZE.width / 2;
  const widthRight = maxX - NODE_SIZE.width / 2;
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

function graphWithSingleBigButton(): ApGraph {
  return {
    nodes: [
      {
        id: nanoid(),
        position: { x: 0, y: 0 },
        type: 'bigButton',
        data: {},
      },
    ],
    edges: [],
  };
}
function stepToNode(step: Action | Trigger): ApNode {
  return {
    id: step.name,
    position: { x: 0, y: 0 },
    type: 'stepNode',
    data: step,
  };
}

function mergeGraph(graph1: ApGraph, graph2: ApGraph): ApGraph {
  return {
    nodes: [...graph1.nodes, ...graph2.nodes],
    edges: [...graph1.edges, ...graph2.edges],
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
  type: string;
  data: Step | {};
};

export type ApEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
};

export type ApGraph = {
  nodes: ApNode[];
  edges: ApEdge[];
};
