import {
  BarrierSignalStatus,
  FlowActionType,
  FlowRunStatus,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  BatchStepRunOutput,
  batchRailUtils,
} from '@/app/builder/run-details/batch-rail-utils';

const pausedOutput: BatchStepRunOutput = {
  barrierId: 'barrier-id',
  totalItems: 5,
  batchSize: 2,
  total: 3,
};

const releasedOutput: BatchStepRunOutput = {
  ...pausedOutput,
  signals: [
    { sequence: 2, outcome: BarrierSignalStatus.NOT_DISPATCHED, runId: null },
  ],
};

describe('batchRailUtils.parseStepOutput', () => {
  it('reads the paused output the step writes before it waits', () => {
    expect(batchRailUtils.parseStepOutput(pausedOutput)).toEqual(pausedOutput);
  });

  it('reads the released summary the step writes when it resumes', () => {
    expect(batchRailUtils.parseStepOutput(releasedOutput)).toEqual(
      releasedOutput,
    );
  });

  it('ignores an output that is not a batch step run', () => {
    expect(batchRailUtils.parseStepOutput({ items: [1, 2] })).toBeNull();
    expect(batchRailUtils.parseStepOutput(undefined)).toBeNull();
  });
});

describe('batchRailUtils.batchCount', () => {
  it('counts the trailing partial batch when the barrier has not reported yet', () => {
    expect(
      batchRailUtils.batchCount({ ...pausedOutput, total: undefined }),
    ).toBe(3);
  });

  it('counts nothing when the items resolved empty', () => {
    expect(
      batchRailUtils.batchCount({
        ...pausedOutput,
        total: undefined,
        totalItems: 0,
      }),
    ).toBe(0);
  });

  it('trusts a released summary over the item arithmetic', () => {
    expect(batchRailUtils.batchCount({ ...pausedOutput, total: 0 })).toBe(0);
  });
});

describe('batchRailUtils.isSkippedOnEmptyItems', () => {
  it('only calls a batch step skipped when its items resolved empty', () => {
    expect(
      batchRailUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: { ...pausedOutput, totalItems: 0 },
      }),
    ).toBe(true);
    expect(
      batchRailUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: pausedOutput,
      }),
    ).toBe(false);
    expect(
      batchRailUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.LOOP_ON_ITEMS,
        stepOutput: { ...pausedOutput, totalItems: 0 },
      }),
    ).toBe(false);
  });
});

describe('batchRailUtils.childState', () => {
  it('separates a batch that never started from one that failed to dispatch', () => {
    expect(
      batchRailUtils.childState({
        output: releasedOutput,
        batchIndex: 2,
        child: null,
      }),
    ).toBe('failedToDispatch');
    expect(
      batchRailUtils.childState({
        output: releasedOutput,
        batchIndex: 1,
        child: null,
      }),
    ).toBe('neverStarted');
  });

  it('separates a straggler from a run whose logs are gone', () => {
    expect(
      batchRailUtils.childState({
        output: releasedOutput,
        batchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.RUNNING, dispatchIndex: 0 },
      }),
    ).toBe('stillRunning');
    expect(
      batchRailUtils.childState({
        output: releasedOutput,
        batchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 },
      }),
    ).toBe('logsExpired');
  });
});
