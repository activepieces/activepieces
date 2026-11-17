// @vitest-environment jsdom
import {
  CodeAction,
  FlowActionType,
  FlowAction,
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  LoopOnItemsAction,
  LoopStepOutput,
  PopulatedFlow,
  ProcessInBatchesAction,
  StepOutput,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { describe, expect, it } from 'vitest';

import { BuilderStore, createBuilderStore } from '@/app/builder/builder-hooks';

const createCodeAction = (name: string): CodeAction => ({
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
});

const createLoopOutput = (
  iterations: Record<string, StepOutput>[],
): LoopStepOutput =>
  LoopStepOutput.init({ input: {} }).setIterations(iterations);

const createChildRunSteps = (
  innerIterationsPerOuterIteration: number[],
): Record<string, StepOutput> => ({
  loop_in_batch: createLoopOutput(
    innerIterationsPerOuterIteration.map((innerIterations) => ({
      loop_in_batch_inner: createLoopOutput(
        Array.from({ length: innerIterations }, () => ({})),
      ),
    })),
  ),
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

const createBatchAction = ({
  name,
  firstLoopAction,
}: {
  name: string;
  firstLoopAction: FlowAction;
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
});

function buildFlow(): PopulatedFlow {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id: 'flow-1',
    created: now,
    updated: now,
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: now,
      updated: now,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: now,
        nextAction: createLoopAction({
          name: 'loop_outside',
          firstLoopAction: createBatchAction({
            name: 'batches',
            firstLoopAction: createLoopAction({
              name: 'loop_in_batch',
              firstLoopAction: createLoopAction({
                name: 'loop_in_batch_inner',
                firstLoopAction: createCodeAction('code_in_batch'),
              }),
            }),
          }),
        }),
      },
    },
  };
}

function createStore(): BuilderStore {
  const flow = buildFlow();
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: true,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io('http://localhost', { autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

describe('setBatchIndex', () => {
  it('resets loop indexes inside the batch and keeps the ones outside it', () => {
    const store = createStore();
    store.getState().setLoopIndex({
      stepName: 'loop_outside',
      index: 3,
      steps: {},
    });
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch',
      index: 2,
      steps: {},
    });

    store.getState().setBatchIndex({ stepName: 'batches', index: 1 });

    expect(store.getState().loopsIndexes.loop_in_batch).toBeUndefined();
    expect(store.getState().loopsIndexes.loop_outside).toBe(3);
    expect(store.getState().batchesIndexes.batches).toBe(1);
  });

  it('keeps the loop index when the selected batch does not change', () => {
    const store = createStore();
    store.getState().setBatchIndex({ stepName: 'batches', index: 1 });
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch',
      index: 2,
      steps: {},
    });

    store.getState().setBatchIndex({ stepName: 'batches', index: 1 });

    expect(store.getState().loopsIndexes.loop_in_batch).toBe(2);
  });
});

describe('setLoopIndex', () => {
  it('keeps a nested loop index when the batch child run still has that iteration', () => {
    const store = createStore();
    const steps = createChildRunSteps([3, 4]);
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch_inner',
      index: 2,
      steps,
    });

    store.getState().setLoopIndex({ stepName: 'loop_in_batch', index: 1, steps });

    expect(store.getState().loopsIndexes.loop_in_batch).toBe(1);
    expect(store.getState().loopsIndexes.loop_in_batch_inner).toBe(2);
  });

  it('clamps a nested loop index to the last iteration of the newly selected one', () => {
    const store = createStore();
    const steps = createChildRunSteps([3, 2]);
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch_inner',
      index: 2,
      steps,
    });

    store.getState().setLoopIndex({ stepName: 'loop_in_batch', index: 1, steps });

    expect(store.getState().loopsIndexes.loop_in_batch_inner).toBe(1);
  });

  it('resets in-batch loop indexes when a loop enclosing the batch changes iteration', () => {
    const store = createStore();
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch',
      index: 1,
      steps: createChildRunSteps([3, 4]),
    });
    store.getState().setLoopIndex({
      stepName: 'loop_in_batch_inner',
      index: 2,
      steps: createChildRunSteps([3, 4]),
    });

    store.getState().setLoopIndex({
      stepName: 'loop_outside',
      index: 1,
      steps: { loop_outside: createLoopOutput([{}, {}]) },
    });

    expect(store.getState().loopsIndexes.loop_outside).toBe(1);
    expect(store.getState().loopsIndexes.loop_in_batch).toBe(0);
    expect(store.getState().loopsIndexes.loop_in_batch_inner).toBe(0);
  });
});
