// @vitest-environment jsdom
import {
  CodeAction,
  FlowAction,
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PieceAction,
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
  skip = false,
): CodeAction => ({
  name,
  skip,
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

const createPieceAction = (name: string, skip = false): PieceAction => ({
  name,
  skip,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.PIECE,
  settings: {
    pieceName: '@activepieces/piece-test',
    pieceVersion: '0.0.1',
    actionName: 'test',
    input: {},
    errorHandlingOptions: {},
  },
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

  it('derives stable step indexes and skip state for canvas nodes', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(
        createCodeAction('step_1', createCodeAction('step_2'), true),
      ),
      notes: [],
      orientation: 'vertical',
    });

    expect(getStepNode(graph, 'trigger').data).toMatchObject({
      stepIndex: 1,
      isSkipped: false,
    });
    expect(getStepNode(graph, 'step_1').data).toMatchObject({
      stepIndex: 2,
      isSkipped: true,
    });
    expect(getStepNode(graph, 'step_2').data).toMatchObject({
      stepIndex: 3,
      isSkipped: false,
    });
  });

  it('keeps skipped piece actions distinct from piece triggers', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(createPieceAction('piece_action', true)),
      notes: [],
      orientation: 'vertical',
    });

    expect(getStepNode(graph, 'piece_action').data.isSkipped).toBe(true);
  });

  it('counts stored continue-on-failure branches when numbering visible steps', () => {
    const parent = createCodeAction('parent', createCodeAction('tail'));
    parent.settings.errorHandlingOptions = {
      continueOnFailure: { value: false },
      retryOnFailure: { value: false },
    };
    parent.continueOnFailureBranches = {
      onSuccess: createCodeAction('hidden_success'),
      onFailure: createCodeAction('hidden_failure'),
    };

    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(parent),
      notes: [],
      orientation: 'vertical',
    });

    expect(getStepNode(graph, 'tail').data.stepIndex).toBe(5);
    expect(graph.nodes.some((node) => node.id === 'hidden_success')).toBe(
      false,
    );
    expect(graph.nodes.some((node) => node.id === 'hidden_failure')).toBe(
      false,
    );
  });

  it('derives branch order and inherited skip state before the next action', () => {
    const parent = createCodeAction('parent', createCodeAction('tail'), true);
    parent.settings.errorHandlingOptions = {
      continueOnFailure: { value: true },
      retryOnFailure: { value: false },
    };
    parent.continueOnFailureBranches = {
      onSuccess: createCodeAction('success', createCodeAction('success_next')),
      onFailure: createCodeAction('failure'),
    };

    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(parent),
      notes: [],
      orientation: 'vertical',
    });

    expect(
      ['parent', 'success', 'success_next', 'failure', 'tail'].map((name) => {
        const { stepIndex, isSkipped } = getStepNode(graph, name).data;
        return { name, stepIndex, isSkipped };
      }),
    ).toEqual([
      { name: 'parent', stepIndex: 2, isSkipped: true },
      { name: 'success', stepIndex: 3, isSkipped: true },
      { name: 'success_next', stepIndex: 4, isSkipped: true },
      { name: 'failure', stepIndex: 5, isSkipped: true },
      { name: 'tail', stepIndex: 6, isSkipped: false },
    ]);
  });
});
