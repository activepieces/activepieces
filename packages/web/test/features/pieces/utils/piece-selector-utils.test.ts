import {
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  LoopOnItemsAction,
  ProcessInBatchesAction,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { pieceSelectorUtils } from '@/features/pieces/utils/piece-selector-utils';

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

const createLoopAction = ({
  name,
  firstLoopAction,
  nextAction,
}: {
  name: string;
  firstLoopAction: FlowAction;
  nextAction: FlowAction;
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
  firstLoopAction: FlowAction;
  nextAction: FlowAction;
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

const trigger: EmptyTrigger = {
  name: 'trigger',
  valid: false,
  displayName: 'Select Trigger',
  type: FlowTriggerType.EMPTY,
  settings: {},
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  nextAction: createLoopAction({
    name: 'loop',
    firstLoopAction: createCodeAction('in_loop'),
    nextAction: createBatchAction({
      name: 'batch',
      firstLoopAction: createCodeAction('in_batch'),
      nextAction: createCodeAction('after_batch'),
    }),
  }),
};

const flowVersion: FlowVersion = {
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

const hiddenOnReplace = (stepName: string) =>
  pieceSelectorUtils.getHiddenStepTypes({
    operation: { type: FlowOperationType.UPDATE_ACTION, stepName },
    flowVersion,
  });

const hiddenOnAdd = ({
  parentStep,
  stepLocationRelativeToParent,
}: {
  parentStep: string;
  stepLocationRelativeToParent: Exclude<
    StepLocationRelativeToParent,
    StepLocationRelativeToParent.INSIDE_BRANCH
  >;
}) =>
  pieceSelectorUtils.getHiddenStepTypes({
    operation: {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: { parentStep, stepLocationRelativeToParent },
    },
    flowVersion,
  });

describe('getHiddenStepTypes', () => {
  it('hides the batch step when adding into a batch body', () => {
    expect(
      hiddenOnAdd({
        parentStep: 'batch',
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH,
      }),
    ).toEqual([FlowActionType.PROCESS_IN_BATCHES]);
    expect(
      hiddenOnAdd({
        parentStep: 'in_batch',
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      }),
    ).toEqual([FlowActionType.PROCESS_IN_BATCHES]);
  });

  it('allows a batch step after a batch step', () => {
    expect(
      hiddenOnAdd({
        parentStep: 'batch',
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
      }),
    ).toEqual([]);
  });

  it('hides the batch step when replacing a step inside a batch body', () => {
    expect(hiddenOnReplace('in_batch')).toEqual([
      FlowActionType.PROCESS_IN_BATCHES,
    ]);
  });

  it('hides the other container when replacing a loop or a batch', () => {
    expect(hiddenOnReplace('loop')).toEqual([
      FlowActionType.PROCESS_IN_BATCHES,
    ]);
    expect(hiddenOnReplace('batch')).toEqual([FlowActionType.LOOP_ON_ITEMS]);
  });

  it('hides nothing when replacing a step outside any batch', () => {
    expect(hiddenOnReplace('in_loop')).toEqual([]);
    expect(hiddenOnReplace('after_batch')).toEqual([]);
    expect(
      pieceSelectorUtils.getHiddenStepTypes({
        operation: { type: FlowOperationType.UPDATE_TRIGGER },
        flowVersion,
      }),
    ).toEqual([]);
  });
});
