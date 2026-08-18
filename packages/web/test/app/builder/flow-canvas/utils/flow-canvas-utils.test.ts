// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  LoopOnItemsAction,
  ProcessInBatchesAction,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { flowCanvasUtils } from '@/app/builder/flow-canvas/utils/flow-canvas-utils';
import { ApEdgeType, ApNodeType } from '@/app/builder/flow-canvas/utils/types';

vi.mock('@/features/flow-runs', () => ({
  flowRunUtils: {
    extractStepOutput: () => undefined,
    findLastStepWithStatus: () => null,
  },
}));

const createCodeAction = (
  name: string,
  nextAction?: CodeAction,
): CodeAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.CODE,
  settings: {
    sourceCode: {
      code: 'export const code = async () => true;',
      packageJson: '{}',
    },
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

const getStepNode = (
  graph: ReturnType<typeof flowCanvasUtils.createFlowGraph>,
  name: string,
) => {
  const node = graph.nodes.find(
    (n) => n.id === name && n.type === ApNodeType.STEP,
  );
  expect(node).toBeDefined();
  return node!;
};

describe('flowCanvasUtils.createFlowGraph', () => {
  it('keeps the existing vertical layout untouched', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(createCodeAction('step_1')),
      notes: [],
      orientation: 'vertical',
    });
    expect(getStepNode(graph, 'trigger').position).toEqual({ x: 0, y: 0 });
    expect(getStepNode(graph, 'step_1').position).toEqual({ x: 0, y: 120 });
  });

  it('lays steps out left to right in horizontal orientation', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(
        createCodeAction('step_1', createCodeAction('step_2')),
      ),
      notes: [],
      orientation: 'horizontal',
    });
    expect(getStepNode(graph, 'trigger').position).toEqual({ x: 0, y: 0 });
    expect(getStepNode(graph, 'step_1').position).toEqual({ x: 160, y: 0 });
    expect(getStepNode(graph, 'step_2').position).toEqual({ x: 320, y: 0 });
  });

  it('connects each step edge to its subgraph end node', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(createCodeAction('step_1')),
      notes: [],
      orientation: 'vertical',
    });
    const triggerEdge = graph.edges.find((edge) => edge.source === 'trigger');
    expect(triggerEdge?.type).toEqual(ApEdgeType.STRAIGHT_LINE);
    expect(triggerEdge?.target).toEqual('trigger-subgraph-end');
    const lastEdge = graph.edges.find((edge) => edge.source === 'step_1');
    expect(lastEdge?.target).toEqual('step_1-subgraph-end');
  });
});

describe('flowCanvasUtils.createFlowGraph — process in batches', () => {
  const buildBatchGraph = (batch: ProcessInBatchesAction) =>
    flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(batch),
      notes: [],
      orientation: 'vertical',
    });

  it('lays batched steps inline in the main column, with no lane and no return node', () => {
    const graph = buildBatchGraph(
      createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
        nextAction: createCodeAction('after_1'),
      }),
    );
    expect(getStepNode(graph, 'batch_1').position).toEqual({ x: 0, y: 120 });
    expect(getStepNode(graph, 'child_1').position).toEqual({ x: 0, y: 240 });
    expect(getStepNode(graph, 'after_1').position).toEqual({ x: 0, y: 420 });
    expect(
      graph.nodes.some((node) => node.type === ApNodeType.LOOP_RETURN_NODE),
    ).toBe(false);
    expect(
      graph.edges.some((edge) =>
        [ApEdgeType.LOOP_START_EDGE, ApEdgeType.LOOP_RETURN_EDGE].includes(
          edge.type,
        ),
      ),
    ).toBe(false);
  });

  it('keeps both bottom seams: append inside the batch, then after it', () => {
    const graph = buildBatchGraph(
      createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
        nextAction: createCodeAction('after_1'),
      }),
    );
    const insideSeam = graph.edges.find((edge) => edge.source === 'child_1');
    expect(insideSeam?.target).toEqual('child_1-subgraph-end');
    expect(insideSeam?.data?.parentStepName).toEqual('child_1');

    const outsideSeam = graph.edges.find(
      (edge) => edge.id === 'batch_1-batch-end-edge',
    );
    expect(outsideSeam?.source).toEqual('child_1-subgraph-end');
    expect(outsideSeam?.data?.parentStepName).toEqual('batch_1');
    expect(outsideSeam?.data?.stepLocationRelativeToParent).toBeUndefined();
  });

  it('adds inside the batch from the entry seam', () => {
    const graph = buildBatchGraph(
      createBatchAction({
        name: 'batch_1',
        firstLoopAction: createCodeAction('child_1'),
      }),
    );
    const entrySeam = graph.edges.find(
      (edge) => edge.id === 'batch_1-batch-start-edge',
    );
    expect(entrySeam?.type).toEqual(ApEdgeType.STRAIGHT_LINE);
    expect(entrySeam?.data).toMatchObject({
      parentStepName: 'batch_1',
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH,
      hideAddButton: false,
    });
  });

  it('puts an empty batch add button in the main column and hides the seam button', () => {
    const graph = buildBatchGraph(createBatchAction({ name: 'batch_1' }));
    const addButton = graph.nodes.find(
      (node) => node.type === ApNodeType.BIG_ADD_BUTTON,
    );
    expect(addButton?.position).toEqual({ x: 0, y: 240 });
    expect(
      graph.edges.find((edge) => edge.id === 'batch_1-batch-start-edge')?.data,
    ).toMatchObject({ hideAddButton: true, drawArrowHead: false });
  });

  it('leaves the loop layout offset into its lane', () => {
    const loop: LoopOnItemsAction = {
      name: 'loop_1',
      valid: true,
      displayName: 'loop_1',
      lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      type: FlowActionType.LOOP_ON_ITEMS,
      settings: { items: '{{ trigger.rows }}' },
      firstLoopAction: createCodeAction('child_1'),
    };
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(loop),
      notes: [],
      orientation: 'vertical',
    });
    expect(getStepNode(graph, 'child_1').position.x).toBeGreaterThan(0);
    expect(
      graph.nodes.some((node) => node.type === ApNodeType.LOOP_RETURN_NODE),
    ).toBe(true);
  });
});
