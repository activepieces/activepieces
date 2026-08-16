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
  ApCanvasHoverTarget,
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

const containsPoint = (
  region: ApBatchRegionNode,
  point: { x: number; y: number },
  orientation: CanvasOrientation = 'vertical',
) => {
  const along = orientation === 'vertical' ? point.y : point.x;
  const cross = orientation === 'vertical' ? point.x : point.y;
  return region.data.bands.some(
    (band) =>
      along >= band.start &&
      along <= band.end &&
      cross >= band.crossStart &&
      cross <= band.crossEnd,
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
const CROSS_PADDING = 16;
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

  it('keeps the batch entry seam inside and the batch step outside', () => {
    const graph = buildGraph({
      firstAction: createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
      }),
    });
    const region = getRegion(graph, 'batch_1');
    const entrySeam = addButtonCentre(graph, 'batch_1-batch-start-edge');
    const batchStep = graph.nodes.find((node) => node.id === 'batch_1')!;
    expect(containsPoint(region, entrySeam)).toBe(true);
    expect(
      containsPoint(region, {
        x: batchStep.position.x + STEP_WIDTH / 2,
        y: batchStep.position.y + STEP_HEIGHT / 2,
      }),
    ).toBe(false);
  });

  it('follows uneven router branches instead of boxing them', () => {
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
    const [branchesBand, deepBranchBand] = region.data.bands.slice(-2);
    expect(deepBranchBand.crossStart).toBeGreaterThan(branchesBand.crossStart);
    expect(deepBranchBand.crossEnd).toEqual(branchesBand.crossEnd);
    expect(
      containsPoint(region, {
        x: branchesBand.crossStart + 1,
        y: deepBranchBand.end - 1,
      }),
    ).toBe(false);
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
    ['vertical', 48],
    ['horizontal', 68],
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
    const crossSpan = (batchName: string) => {
      const bands = getRegion(graph, batchName).data.bands;
      return {
        start: Math.min(...bands.map((band) => band.crossStart)),
        end: Math.max(...bands.map((band) => band.crossEnd)),
      };
    };
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
    expect(region.data.size.width).toBeGreaterThan(region.data.size.height);
    expect(containsPoint(region, centreOf('child_1'), 'horizontal')).toBe(true);
    expect(containsPoint(region, centreOf('batch_1'), 'horizontal')).toBe(
      false,
    );
    expect(containsPoint(region, centreOf('after'), 'horizontal')).toBe(false);
  });

  describe('highlight', () => {
    const region = { stepName: 'batch_1', childNames: ['child_1'] };
    const highlight = (
      selectedNodes: string[],
      hoveredTarget: ApCanvasHoverTarget | null,
    ) =>
      batchRegionUtils.isRegionHighlighted({
        ...region,
        selectedNodes,
        hoveredTarget,
      });

    it('follows selection of the batch step, not of its children', () => {
      expect(highlight(['batch_1'], null)).toBe(true);
      expect(highlight(['child_1'], null)).toBe(false);
      expect(highlight([], null)).toBe(false);
    });

    it('tells the two bottom seams apart', () => {
      expect(highlight([], { stepName: 'child_1', isInsideStep: false })).toBe(
        true,
      );
      expect(highlight([], { stepName: 'batch_1', isInsideStep: false })).toBe(
        false,
      );
    });

    it('follows a target that lands inside the batch', () => {
      expect(highlight([], { stepName: 'batch_1', isInsideStep: true })).toBe(
        true,
      );
      expect(highlight([], { stepName: 'after', isInsideStep: false })).toBe(
        false,
      );
    });
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
    region.data.bands.forEach((band) => {
      expect(band.crossStart).toEqual(batchStep.position.x - CROSS_PADDING);
      expect(band.crossStart).toBeGreaterThan(loopReturn.position.x);
    });
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
    const railStart = loopReturn.position.x + STEP_WIDTH / 2 - CROSS_PADDING;
    const loopChild = graph.nodes.find((node) => node.id === 'child_1')!;
    region.data.bands.forEach((band) => {
      expect(band.crossStart).toBeLessThanOrEqual(spineStart);
    });
    expect(
      region.data.bands
        .filter(
          (band) =>
            band.start <= loopChild.position.y &&
            band.end >= loopChild.position.y,
        )
        .every((band) => band.crossStart === railStart),
    ).toBe(true);
    expect(
      Math.min(...region.data.bands.map((band) => band.crossStart)),
    ).toEqual(railStart);
    expect(
      region.data.bands.some((band) => band.crossEnd > spineStart + STEP_WIDTH),
    ).toBe(true);
    const railBottom = 2 * loopReturn.position.y - loopChild.position.y;
    const widest = Math.max(...region.data.bands.map((band) => band.crossEnd));
    region.data.bands
      .filter(
        (band) => band.start < railBottom && band.end > loopChild.position.y,
      )
      .forEach((band) => {
        expect(band.crossEnd).toEqual(widest);
      });
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
    const leftmost = Math.min(
      ...region.data.bands.map((band) => band.crossStart),
    );
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
