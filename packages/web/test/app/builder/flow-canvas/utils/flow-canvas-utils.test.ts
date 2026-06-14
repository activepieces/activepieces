// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
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

const createCodeAction = (name: string, nextAction?: CodeAction): CodeAction => ({
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

const createFlowVersion = (firstAction?: CodeAction): FlowVersion => {
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
