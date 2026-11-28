// @vitest-environment jsdom
import {
  BranchExecutionType,
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  LoopOnItemsAction,
  ProcessInBatchesAction,
  RouterAction,
  RouterExecutionType,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { batchRegionUtils } from '@/app/builder/flow-canvas/utils/batch-region';
import { flowCanvasUtils } from '@/app/builder/flow-canvas/utils/flow-canvas-utils';
import {
  ApBatchRegionNode,
  ApGraph,
  ApNodeType,
  CanvasOrientation,
} from '@/app/builder/flow-canvas/utils/types';

vi.mock('@/features/flow-runs', () => ({
  flowRunUtils: {
    extractStepOutput: () => undefined,
    findLastStepWithStatus: () => null,
  },
}));

const createCodeAction = (
  name: string,
  nextAction?: FlowAction,
): CodeAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.CODE,
  settings: {
    sourceCode: { code: '', packageJson: '{}' },
    input: {},
    errorHandlingOptions: {},
  },
  nextAction,
});

const createBatchAction = ({
  name,
  firstLoopAction,
  nextAction,
}: {
  name: string;
  firstLoopAction?: FlowAction;
  nextAction?: FlowAction;
}): ProcessInBatchesAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.PROCESS_IN_BATCHES,
  settings: {
    items: '{{ trigger.rows }}',
    batchSize: 10,
    errorHandlingOptions: {},
  },
  firstLoopAction,
  nextAction,
});

const createLoopAction = ({
  name,
  firstLoopAction,
  nextAction,
}: {
  name: string;
  firstLoopAction?: FlowAction;
  nextAction?: FlowAction;
}): LoopOnItemsAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.LOOP_ON_ITEMS,
  settings: { items: '{{ trigger.rows }}' },
  firstLoopAction,
  nextAction,
});

const createRouterAction = ({
  name,
  children,
}: {
  name: string;
  children: (FlowAction | null)[];
}): RouterAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.ROUTER,
  settings: {
    branches: children.map((_, index) => ({
      branchName: `Branch ${index + 1}`,
      branchType: BranchExecutionType.FALLBACK,
    })),
    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
  },
  children,
});

const createFlowVersion = (firstAction?: FlowAction): FlowVersion => {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: firstAction,
  };
  return {
    id: 'version-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-id',
    displayName: 'Test flow',
    trigger,
    updatedBy: null,
    valid: false,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.DRAFT,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
};

const buildGraph = ({
  firstAction,
  orientation = 'vertical',
}: {
  firstAction: FlowAction;
  orientation?: CanvasOrientation;
}) =>
  flowCanvasUtils.createFlowGraph({
    version: createFlowVersion(firstAction),
    notes: [],
    orientation,
  });

const getRegion = (graph: ApGraph, batchName: string): ApBatchRegionNode => {
  const region = graph.nodes.find(
    (node): node is ApBatchRegionNode =>
      node.type === ApNodeType.BATCH_REGION &&
      node.id === `${batchName}-batch-region`,
  );
  expect(region).toBeDefined();
  return region!;
};

const spanOf = (
  region: ApBatchRegionNode,
  orientation: CanvasOrientation = 'vertical',
) => {
  const x = {
    start: region.position.x,
    end: region.position.x + region.data.size.width,
  };
  const y = {
    start: region.position.y,
    end: region.position.y + region.data.size.height,
  };
  return orientation === 'vertical'
    ? { along: y, cross: x }
    : { along: x, cross: y };
};

const containsPoint = (
  region: ApBatchRegionNode,
  point: { x: number; y: number },
  orientation: CanvasOrientation = 'vertical',
) => {
  const { along, cross } = spanOf(region, orientation);
  const alongValue = orientation === 'vertical' ? point.y : point.x;
  const crossValue = orientation === 'vertical' ? point.x : point.y;
  return (
    alongValue >= along.start &&
    alongValue <= along.end &&
    crossValue >= cross.start &&
    crossValue <= cross.end
  );
};

const addButtonCentre = (graph: ApGraph, edgeId: string) => {
  const edge = graph.edges.find((candidate) => candidate.id === edgeId);
  expect(edge).toBeDefined();
  const anchorOf = (nodeId: string) => {
    const node = graph.nodes.find((candidate) => candidate.id === nodeId)!;
    return node.type === ApNodeType.GRAPH_END_WIDGET
      ? { x: node.position.x, y: node.position.y }
      : {
          x: node.position.x + STEP_WIDTH / 2,
          y: node.position.y + STEP_HEIGHT,
        };
  };
  const source = anchorOf(edge!.source);
  const target = anchorOf(edge!.target);
  return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
};

const HORIZONTAL_STEP_SIZE = 80;
const STEP_WIDTH = 232;
const STEP_HEIGHT = 60;
const CROSS_PADDING = 24;
const RAIL_PADDING = 64;
const ROUTER_BRANCH_GAP = 80;

describe('batch region silhouette', () => {
  it('is not emitted for a flow without a batch', () => {
    const graph = buildGraph({ firstAction: createCodeAction('step_1') });
    expect(
      graph.nodes.filter((node) => node.type === ApNodeType.BATCH_REGION),
    ).toEqual([]);
  });

  it('separates the two bottom seams of a single-step batch', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
        nextAction: createCodeAction('after'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const insideSeam = addButtonCentre(graph, 'child_1-graph-end-edge');
    const outsideSeam = addButtonCentre(graph, 'batch_1-batch-end-edge');
    expect(containsPoint(region, insideSeam)).toBe(true);
    expect(containsPoint(region, outsideSeam)).toBe(false);
  });

  it('starts at the middle of the batch step and keeps the entry seam inside', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const entrySeam = addButtonCentre(graph, 'batch_1-batch-start-edge');
    const batchStep = graph.nodes.find((node) => node.id === 'batch_1')!;
    expect(spanOf(region).along.start).toEqual(
      batchStep.position.y + STEP_HEIGHT / 2,
    );
    expect(containsPoint(region, entrySeam)).toBe(true);
    expect(
      containsPoint(region, {
        x: batchStep.position.x + STEP_WIDTH / 2,
        y: batchStep.position.y + STEP_HEIGHT / 2 - 1,
      }),
    ).toBe(false);
  });

  it('boxes uneven router branches at the widest branch', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createRouterAction({
          name: 'router_1',
          children: [
            createCodeAction('short'),
            createCodeAction('long_a', createCodeAction('long_b')),
          ],
        }),
        nextAction: createCodeAction('after'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const { cross } = spanOf(region);
    const branchSteps = ['short', 'long_a', 'long_b'].map((name) =>
      graph.nodes.find((node) => node.id === name)!,
    );
    branchSteps.forEach((step) => {
      expect(cross.start).toBeLessThanOrEqual(step.position.x - CROSS_PADDING);
      expect(cross.end).toBeGreaterThanOrEqual(
        step.position.x + STEP_WIDTH + CROSS_PADDING,
      );
    });
    expect(
      containsPoint(region, {
        x: cross.start + 1,
        y: branchSteps[2].position.y + STEP_HEIGHT / 2,
      }),
    ).toBe(true);
  });

  it('closes around the lone add button of an empty batch', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        nextAction: createCodeAction('after'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const addButton = graph.nodes.find(
      (node) => node.type === ApNodeType.BIG_ADD_BUTTON,
    )!;
    expect(
      containsPoint(region, {
        x: addButton.position.x + STEP_WIDTH / 2,
        y: addButton.position.y + STEP_HEIGHT / 2,
      }),
    ).toBe(true);
  });

  it.each<[CanvasOrientation, number]>([
    ['vertical', 32],
    ['horizontal', 52],
  ])('clears its sibling branch in %s', (orientation, clearance) => {
    const graph = buildGraph({
      firstAction: createRouterAction({
        name: 'router_1',
        children: [
          createBatchAction({
            name: 'batch_a',
            firstLoopAction: createCodeAction('child_a'),
          }),
          createBatchAction({
            name: 'batch_b',
            firstLoopAction: createCodeAction('child_b'),
          }),
        ],
      }),
      orientation,
    });
    const crossSpan = (batchName: string) =>
      spanOf(getRegion(graph, batchName), orientation).cross;
    const left = crossSpan('batch_a');
    const right = crossSpan('batch_b');
    expect(right.start - left.end).toBe(clearance);
  });

  it('transposes with the canvas in horizontal orientation', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
        nextAction: createCodeAction('after'),
      }),
      orientation: 'horizontal',
    });
    const region = getRegion(graph, 'batch_1');
    const centreOf = (nodeId: string) => {
      const node = graph.nodes.find((candidate) => candidate.id === nodeId)!;
      return {
        x: node.position.x + HORIZONTAL_STEP_SIZE / 2,
        y: node.position.y + HORIZONTAL_STEP_SIZE / 2,
      };
    };
    const batchStep = graph.nodes.find((node) => node.id === 'batch_1')!;
    expect(region.data.size.width).toBeGreaterThan(region.data.size.height);
    expect(spanOf(region, 'horizontal').along.start).toEqual(
      batchStep.position.x + HORIZONTAL_STEP_SIZE / 2,
    );
    expect(containsPoint(region, centreOf('child_1'), 'horizontal')).toBe(true);
    expect(
      containsPoint(
        region,
        { x: batchStep.position.x, y: centreOf('batch_1').y },
        'horizontal',
      ),
    ).toBe(false);
    expect(containsPoint(region, centreOf('after'), 'horizontal')).toBe(false);
  });

  it('hangs from the batch column when the batch sits in a loop lane', () => {
    const graph = buildGraph({
      firstAction: createLoopAction({
        name: 'loop_1',
        firstLoopAction: createBatchAction({
          name: 'batch_1',
          firstLoopAction: createCodeAction('child_1'),
        }),
        nextAction: createCodeAction('after_loop'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const batchStep = graph.nodes.find((node) => node.id === 'batch_1')!;
    const loopReturn = graph.nodes.find(
      (node) => node.type === ApNodeType.LOOP_RETURN_NODE,
    )!;
    const { cross } = spanOf(region);
    expect(cross.start).toEqual(batchStep.position.x - CROSS_PADDING);
    expect(cross.start).toBeGreaterThan(loopReturn.position.x);
  });

  it('wraps the loop return rail when a loop sits in the batch', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createLoopAction({
          name: 'loop_1',
          firstLoopAction: createCodeAction('child_1'),
          nextAction: createCodeAction('after_loop'),
        }),
        nextAction: createCodeAction('after_batch'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const batchStep = graph.nodes.find((node) => node.id === 'batch_1')!;
    const spineStart = batchStep.position.x - CROSS_PADDING;
    const loopReturn = graph.nodes.find(
      (node) => node.type === ApNodeType.LOOP_RETURN_NODE,
    )!;
    const railStart = loopReturn.position.x + STEP_WIDTH / 2 - RAIL_PADDING;
    const { cross } = spanOf(region);
    expect(cross.start).toEqual(railStart);
    expect(cross.start).toBeLessThanOrEqual(spineStart);
    expect(cross.end).toBeGreaterThan(spineStart + STEP_WIDTH);
  });

  it('clears the sibling step when the batch sits in a router branch', () => {
    const graph = buildGraph({
      firstAction: createRouterAction({
        name: 'router_1',
        children: [
          createCodeAction('plain'),
          createBatchAction({
            name: 'batch_1',
            firstLoopAction: createCodeAction('child_1'),
          }),
        ],
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const sibling = graph.nodes.find((node) => node.id === 'plain')!;
    const leftmost = spanOf(region).cross.start;
    expect(leftmost - (sibling.position.x + STEP_WIDTH)).toEqual(
      ROUTER_BRANCH_GAP - CROSS_PADDING,
    );
  });

  it('is inert on the canvas', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    expect(region.selectable).toBe(false);
    expect(region.draggable).toBe(false);
    expect(region.zIndex).toBe(0);
  });
});
