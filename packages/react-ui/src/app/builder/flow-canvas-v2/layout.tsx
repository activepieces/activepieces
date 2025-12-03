import { Node, Edge } from '@xyflow/react';
import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';

export const NODE_WIDTH = 300;
export const NODE_HEIGHT = 100;

const elk = new ELK();

type ElkNodeMap = { [id: string]: ElkNode };

export const getLayoutedElements = async (nodes: Node[], edges: Edge[]) => {
  // Transform nodes/edges to ELK format
  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    // children may be attached in a later recursive call (not needed here)
  }));

  // Convert edges
  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  // Build ELK input hierarchy: attempting to handle branches for centering
  // We'll try to form a root and attach all nodes by edge connectivity
  // ELK will auto-center parent node above branches if layout is layered and there's a split

  // No need for true hierarchy for simple flows, just top-level nodes/edges
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.spacing.nodeNodeBetweenLayers': '125',
      'elk.spacing.nodeNode': '80',
      'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  // Run ELK layout engine
  const layouted = await elk.layout(elkGraph);

  // Map positions back to original node ids
  const nodeLayoutMap: ElkNodeMap = {};
  (layouted.children || []).forEach((n) => {
    nodeLayoutMap[n.id] = n;
  });

  const layoutedNodes: Node[] = nodes.map((node) => {
    const elkNode = nodeLayoutMap[node.id];
    return {
      ...node,
      position: elkNode
        ? {
            x: elkNode.x ?? 0,
            y: elkNode.y ?? 0,
          }
        : { x: 0, y: 0 },
    };
  });

  return { nodes: layoutedNodes, edges };
};

