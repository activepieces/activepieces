import {
  Action,
  ActionType,
  FlowVersion,
  Trigger,
  isNil,
} from '@activepieces/shared';

const VERTICAL_OFFSET = 150;
const HORIZONTAL_SPACE_BETWEEN_NODES = 150;
const NODE_SIZE = {
  width: 260,
  height: 70,
}

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
  let graph: ApGraph = {
    nodes: [stepToNode(step)],
    edges: [],
  };
  switch (step.type) {
    case ActionType.BRANCH: {
      const { onSuccessAction, onFailureAction } = step;

      const leftChildGraph = traverseFlow(onSuccessAction);
      const leftChildGraphBoundingBox = boundingBox(leftChildGraph);
      if (leftChildGraph.nodes.length > 0) {
        graph.edges.push(addEdge(graph.nodes[0], leftChildGraph.nodes[0]));
      }
      graph = mergeGraph(graph, offsetGraph(leftChildGraph, { x: -leftChildGraphBoundingBox.width/2 - HORIZONTAL_SPACE_BETWEEN_NODES / 2, y: VERTICAL_OFFSET }));

      const rightChildGraph = traverseFlow(onFailureAction);
      const rightChildGraphBoundingBox = boundingBox(rightChildGraph);
      if (rightChildGraph.nodes.length > 0) {
        graph.edges.push(addEdge(graph.nodes[0], rightChildGraph.nodes[0]));
      }
      graph =  mergeGraph(graph, offsetGraph(rightChildGraph, { x: rightChildGraphBoundingBox.width/2 + HORIZONTAL_SPACE_BETWEEN_NODES / 2, y: VERTICAL_OFFSET }));
      break;
    }
    default: {
      break;
    }
  }
  const { nextAction } = step;
  const childGraph = offsetGraph(traverseFlow(nextAction), {
    x: 0,
    y: VERTICAL_OFFSET,
  });
  if (childGraph.nodes.length > 0) {
    graph.edges.push(addEdge(stepToNode(step), childGraph.nodes[0]));
  }
  return mergeGraph(graph, childGraph);
}

function addEdge(nodeOne: ApNode, nodeTwo: ApNode): ApEdge {
  return {
    id: `${nodeOne.id}-${nodeTwo.id}`,
    source: nodeOne.id,
    target: nodeTwo.id,
    type: 'apEdge',
    label: nodeTwo.data.displayName,
  };
}


function boundingBox(graph: ApGraph): ApBoundingBox {
  const minX = Math.min(...graph.nodes.map((node) => node.position.x));
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(...graph.nodes.map((node) => node.position.x + NODE_SIZE.width));
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y + NODE_SIZE.height));
  const width = maxX - minX;
  const height = maxY - minY;
  return { width: width, height };
}

function offsetGraph(
  graph: ApGraph,
  offset: { x: number; y: number }
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
};

export type ApNode = {
  id: string;
  position: { x: number; y: number };
  type: string;
  data: Step;
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
