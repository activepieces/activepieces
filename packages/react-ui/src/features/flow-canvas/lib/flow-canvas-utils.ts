import {
  Action,
  ActionType,
  FlowVersion,
  Trigger,
  isNil,
} from '@activepieces/shared';

const VERTICAL_OFFSET = 150;

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
    case ActionType.BRANCH: {
      const { onSuccessAction, onFailureAction } = step;
      const childGraph = offsetGraph(traverseFlow(onSuccessAction), {
        x: -150,
        y: VERTICAL_OFFSET,
      });
      if (childGraph.nodes.length > 0) {
        graph.edges.push(addEdge(stepToNode(step), childGraph.nodes[0]));
      }
      const childGraphFailure = offsetGraph(traverseFlow(onFailureAction), {
        x: 150,
        y: VERTICAL_OFFSET,
      });
      if (childGraphFailure.nodes.length > 0) {
        graph.edges.push(addEdge(stepToNode(step), childGraphFailure.nodes[0]));
      }
      graph.edges.push(...childGraph.edges);
      graph.nodes.push(...childGraph.nodes);

      graph.edges.push(...childGraphFailure.edges);
      graph.nodes.push(...childGraphFailure.nodes);
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
