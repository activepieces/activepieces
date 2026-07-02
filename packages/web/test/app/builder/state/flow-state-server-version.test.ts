// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowStatus,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';

vi.mock('@/features/flow-runs', () => ({
  flowRunUtils: {
    extractStepOutput: () => undefined,
    findLastStepWithStatus: () => null,
    snapLoopsToLatestIteration: () => ({}),
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
    sourceCode: { code: 'export const code = async () => true;', packageJson: '{}' },
    input: {},
    errorHandlingOptions: {},
  },
  nextAction,
});

const createFlowVersion = (
  overrides?: Partial<FlowVersion> & { firstAction?: CodeAction },
): FlowVersion => {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: overrides?.firstAction,
  };
  return {
    id: 'version-1',
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
    ...overrides,
  };
};

const createStore = (flowVersion: FlowVersion): BuilderStore => {
  const flow = {
    id: 'flow-id',
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    folderId: null,
    version: flowVersion,
  } as unknown as PopulatedFlow;
  return createBuilderStore({
    flow,
    flowVersion,
    readonly: false,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: {} as Socket,
    queryClient: new QueryClient(),
  });
};

describe('flow-state server version setters', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('applyServerVersion swaps the version and marks changed steps', () => {
    const store = createStore(createFlowVersion());
    const next = createFlowVersion({
      firstAction: createCodeAction('step_1'),
    });

    store.getState().applyServerVersion({
      flowVersion: next,
      changedStepNames: ['step_1'],
    });

    const state = store.getState();
    expect(state.flowVersion.trigger.nextAction?.name).toBe('step_1');
    expect(state.recentlyChangedSteps['step_1']).toBeGreaterThan(Date.now());
  });

  it('applyServerVersion is idempotent — re-applying the same snapshot is a no-op for structure', () => {
    const store = createStore(createFlowVersion());
    const next = createFlowVersion({
      firstAction: createCodeAction('step_1'),
    });

    store.getState().applyServerVersion({ flowVersion: next, changedStepNames: ['step_1'] });
    store.getState().applyServerVersion({ flowVersion: next, changedStepNames: ['step_1'] });

    expect(store.getState().flowVersion).toEqual(next);
  });

  it('does not touch readonly (decoupled from the lock-driven readonly)', () => {
    const store = createStore(createFlowVersion());
    store.getState().setReadOnly(true);

    store.getState().applyServerVersion({
      flowVersion: createFlowVersion({ firstAction: createCodeAction('step_1') }),
      changedStepNames: ['step_1'],
    });

    expect(store.getState().readonly).toBe(true);
  });

  it('clears a selection that points at a step removed by the server version', () => {
    const store = createStore(createFlowVersion({ firstAction: createCodeAction('step_1') }));
    store.getState().selectStepByName('step_1');
    expect(store.getState().selectedStep).toBe('step_1');

    store.getState().applyServerVersion({
      flowVersion: createFlowVersion(),
      changedStepNames: [],
    });

    expect(store.getState().selectedStep).toBeNull();
  });

  it('keeps a selection that still exists in the server version', () => {
    const store = createStore(createFlowVersion({ firstAction: createCodeAction('step_1') }));
    store.getState().selectStepByName('step_1');

    store.getState().applyServerVersion({
      flowVersion: createFlowVersion({
        firstAction: createCodeAction('step_1', createCodeAction('step_2')),
      }),
      changedStepNames: ['step_2'],
    });

    expect(store.getState().selectedStep).toBe('step_1');
  });

  it('reconcileServerVersion swaps the version without highlighting', () => {
    const store = createStore(createFlowVersion());
    store.getState().reconcileServerVersion(
      createFlowVersion({ firstAction: createCodeAction('step_1') }),
    );
    expect(store.getState().flowVersion.trigger.nextAction?.name).toBe('step_1');
    expect(store.getState().recentlyChangedSteps).toEqual({});
  });

  it('applyServerFlow patches flow-level fields without touching the version or selection', () => {
    const store = createStore(
      createFlowVersion({ firstAction: createCodeAction('step_1') }),
    );
    store.getState().selectStepByName('step_1');
    const versionBefore = store.getState().flowVersion;

    store.getState().applyServerFlow({
      status: FlowStatus.ENABLED,
      publishedVersionId: 'version-1',
      folderId: 'folder-9',
    });

    const state = store.getState();
    expect(state.flow.status).toBe(FlowStatus.ENABLED);
    expect(state.flow.publishedVersionId).toBe('version-1');
    expect(state.flow.folderId).toBe('folder-9');
    expect(state.flowVersion).toBe(versionBefore);
    expect(state.selectedStep).toBe('step_1');
  });

  it('clearExpiredChangedSteps prunes only expired highlights', () => {
    const store = createStore(createFlowVersion());
    store.setState({
      recentlyChangedSteps: { expired: Date.now() - 1000, fresh: Date.now() + 10_000 },
    });

    store.getState().clearExpiredChangedSteps();

    expect(store.getState().recentlyChangedSteps).toEqual({
      fresh: expect.any(Number),
    });
  });
});
