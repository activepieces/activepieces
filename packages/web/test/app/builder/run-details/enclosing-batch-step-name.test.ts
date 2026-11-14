// @vitest-environment jsdom
import {
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  LoopOnItemsAction,
  ProcessInBatchesAction,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { enclosingBatchStepName } from '@/app/builder/run-details/use-batch-logs';

const createCodeAction = (name: string, nextAction?: FlowAction): CodeAction => ({
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

const createTrigger = (firstAction: FlowAction): EmptyTrigger => ({
  name: 'trigger',
  valid: false,
  displayName: 'Select Trigger',
  type: FlowTriggerType.EMPTY,
  settings: {},
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  nextAction: firstAction,
});

const trigger = createTrigger(
  createLoopAction({
    name: 'loop_outside',
    firstLoopAction: createCodeAction('code_in_loop_outside'),
    nextAction: createBatchAction({
      name: 'batches',
      firstLoopAction: createLoopAction({
        name: 'loop_in_batch',
        firstLoopAction: createCodeAction('code_in_batch_loop'),
        nextAction: createCodeAction('code_in_batch'),
      }),
      nextAction: createCodeAction('step_after_batch'),
    }),
  }),
);

describe('enclosingBatchStepName', () => {
  it.each([
    ['code_in_batch', 'batches'],
    ['loop_in_batch', 'batches'],
    ['code_in_batch_loop', 'batches'],
  ])('resolves %s to its enclosing batch', (stepName, expected) => {
    expect(enclosingBatchStepName({ stepName, trigger })).toBe(expected);
  });

  it.each([
    ['batches'],
    ['step_after_batch'],
    ['loop_outside'],
    ['code_in_loop_outside'],
    ['trigger'],
  ])('resolves %s to no batch', (stepName) => {
    expect(enclosingBatchStepName({ stepName, trigger })).toBeNull();
  });
});
