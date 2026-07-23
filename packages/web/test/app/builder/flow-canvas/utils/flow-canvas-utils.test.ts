// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  Note,
  NoteColorVariant,
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

const createNote = ({
  id,
  anchor = null,
  position = { x: 500, y: 500 },
}: {
  id: string;
  anchor?: Note['anchor'];
  position?: { x: number; y: number };
}): Note => ({
  id,
  content: 'note content',
  ownerId: null,
  color: NoteColorVariant.YELLOW,
  position,
  size: { width: 200, height: 100 },
  anchor,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const getNoteNode = (
  graph: ReturnType<typeof flowCanvasUtils.createFlowGraph>,
  id: string,
) => {
  const node = graph.nodes.find(
    (n) => n.id === id && n.type === ApNodeType.NOTE,
  );
  expect(node).toBeDefined();
  return node!;
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

  it('renders an anchored note at the step position plus offset and follows the step when layout shifts', () => {
    const note = createNote({
      id: 'note-1',
      anchor: { stepName: 'step_2', offset: { x: 250, y: 10 } },
    });
    const singleStep = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(createCodeAction('step_2')),
      notes: [note],
      orientation: 'vertical',
    });
    const stepBefore = getStepNode(singleStep, 'step_2');
    expect(getNoteNode(singleStep, 'note-1').position).toEqual({
      x: stepBefore.position.x + 250,
      y: stepBefore.position.y + 10,
    });
    const withStepAdded = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(
        createCodeAction('step_1', createCodeAction('step_2')),
      ),
      notes: [note],
      orientation: 'vertical',
    });
    const stepAfter = getStepNode(withStepAdded, 'step_2');
    expect(stepAfter.position).not.toEqual(stepBefore.position);
    expect(getNoteNode(withStepAdded, 'note-1').position).toEqual({
      x: stepAfter.position.x + 250,
      y: stepAfter.position.y + 10,
    });
  });

  it('falls back to the stored position when the anchored step does not exist', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(createCodeAction('step_1')),
      notes: [
        createNote({
          id: 'note-1',
          anchor: { stepName: 'ghost', offset: { x: 1, y: 1 } },
          position: { x: 42, y: 43 },
        }),
      ],
      orientation: 'vertical',
    });
    expect(getNoteNode(graph, 'note-1').position).toEqual({ x: 42, y: 43 });
  });

  it('renders free notes at their stored position in both orientations', () => {
    const note = createNote({ id: 'note-1', position: { x: 42, y: 43 } });
    for (const orientation of ['vertical', 'horizontal'] as const) {
      const graph = flowCanvasUtils.createFlowGraph({
        version: createFlowVersion(createCodeAction('step_1')),
        notes: [note],
        orientation,
      });
      expect(getNoteNode(graph, 'note-1').position).toEqual({ x: 42, y: 43 });
    }
  });

  it('applies the anchor offset to the transposed step position in horizontal orientation', () => {
    const graph = flowCanvasUtils.createFlowGraph({
      version: createFlowVersion(
        createCodeAction('step_1', createCodeAction('step_2')),
      ),
      notes: [
        createNote({
          id: 'note-1',
          anchor: { stepName: 'step_2', offset: { x: 0, y: 90 } },
        }),
      ],
      orientation: 'horizontal',
    });
    const stepNode = getStepNode(graph, 'step_2');
    expect(getNoteNode(graph, 'note-1').position).toEqual({
      x: stepNode.position.x,
      y: stepNode.position.y + 90,
    });
  });
});
