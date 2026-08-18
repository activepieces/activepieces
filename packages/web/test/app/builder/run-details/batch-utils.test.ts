import {
  BarrierSignalStatus,
  FlowActionType,
  FlowRunStatus,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  BatchStepRunOutput,
  batchUtils,
} from '@/app/builder/run-details/batch-utils';

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

describe('batchUtils.parseStepOutput', () => {
  it('reads the paused output the step writes before it waits', () => {
    expect(batchUtils.parseStepOutput(pausedOutput)).toEqual(pausedOutput);
  });

  it('reads the released summary the step writes when it resumes', () => {
    expect(batchUtils.parseStepOutput(releasedOutput)).toEqual(
      releasedOutput,
    );
  });

  it('ignores an output that is not a batch step run', () => {
    expect(batchUtils.parseStepOutput({ items: [1, 2] })).toBeNull();
    expect(batchUtils.parseStepOutput(undefined)).toBeNull();
  });
});

describe('batchUtils.batchCount', () => {
  it('counts the trailing partial batch when the barrier has not reported yet', () => {
    expect(
      batchUtils.batchCount({ ...pausedOutput, total: undefined }),
    ).toBe(3);
  });

  it('counts nothing when the items resolved empty', () => {
    expect(
      batchUtils.batchCount({
        ...pausedOutput,
        total: undefined,
        totalItems: 0,
      }),
    ).toBe(0);
  });

  it('trusts a released summary over the item arithmetic', () => {
    expect(batchUtils.batchCount({ ...pausedOutput, total: 0 })).toBe(0);
  });
});

describe('batchUtils.isSkippedOnEmptyItems', () => {
  it('only calls a batch step skipped when its items resolved empty', () => {
    expect(
      batchUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: { ...pausedOutput, totalItems: 0 },
      }),
    ).toBe(true);
    expect(
      batchUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: pausedOutput,
      }),
    ).toBe(false);
    expect(
      batchUtils.isSkippedOnEmptyItems({
        stepType: FlowActionType.LOOP_ON_ITEMS,
        stepOutput: { ...pausedOutput, totalItems: 0 },
      }),
    ).toBe(false);
  });
});

describe('batchUtils.childState', () => {
  it('separates a batch that never started from one that failed to dispatch', () => {
    expect(
      batchUtils.childState({
        output: releasedOutput,
        batchIndex: 2,
        child: null,
      }),
    ).toBe('failedToDispatch');
    expect(
      batchUtils.childState({
        output: releasedOutput,
        batchIndex: 1,
        child: null,
      }),
    ).toBe('neverStarted');
  });

  it('does not claim a batch never started when the summary omitted its signals', () => {
    expect(
      batchUtils.childState({
        output: { ...pausedOutput, signalsTruncated: true },
        batchIndex: 2,
        child: null,
      }),
    ).toBe('outcomeUnknown');
    expect(batchUtils.missingLogsCopy('outcomeUnknown')).not.toBeNull();
  });

  it('separates a straggler from a run whose logs are gone', () => {
    expect(
      batchUtils.childState({
        output: releasedOutput,
        batchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.RUNNING, dispatchIndex: 0 },
      }),
    ).toBe('stillRunning');
    expect(
      batchUtils.childState({
        output: releasedOutput,
        batchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 },
      }),
    ).toBe('logsExpired');
  });
});

describe('batchUtils.headerState', () => {
  it('has no tiles while the barrier is still pending', () => {
    expect(batchUtils.headerState(pausedOutput)).toEqual({
      kind: 'pending',
      total: 3,
    });
    expect(batchUtils.headerState(null)).toEqual({ kind: 'unknown' });
  });

  it('folds every unfavourable outcome into one failed count', () => {
    expect(
      batchUtils.headerState({
        ...pausedOutput,
        total: 10,
        succeeded: 5,
        failed: 2,
        rejected: 1,
        canceled: 1,
        notDispatched: 1,
        stillRunning: 0,
      }),
    ).toEqual({
      kind: 'finished',
      total: 10,
      succeeded: 5,
      failed: 5,
      running: 0,
      timedOut: false,
    });
  });

  it('carries the timed-out verdict so a partial release is not shown as a clean finish', () => {
    expect(
      batchUtils.headerState({
        ...pausedOutput,
        total: 10,
        succeeded: 5,
        failed: 0,
        rejected: 0,
        canceled: 0,
        notDispatched: 0,
        stillRunning: 5,
        timedOut: true,
      }),
    ).toEqual({
      kind: 'finished',
      total: 10,
      succeeded: 5,
      failed: 0,
      running: 5,
      timedOut: true,
    });
  });
});

describe('batchUtils.itemRange', () => {
  it('derives the range from the batch size', () => {
    const output = { ...pausedOutput, totalItems: 25, batchSize: 10 };
    expect(batchUtils.itemRange({ output, dispatchIndex: 0 })).toEqual({
      from: 1,
      to: 10,
    });
    expect(batchUtils.itemRange({ output, dispatchIndex: 1 })).toEqual({
      from: 11,
      to: 20,
    });
  });

  it('clamps the last, partially filled batch to the item count', () => {
    expect(
      batchUtils.itemRange({
        output: { ...pausedOutput, totalItems: 25, batchSize: 10 },
        dispatchIndex: 2,
      }),
    ).toEqual({ from: 21, to: 25 });
  });
});

describe('batchUtils.parseJumpTarget', () => {
  const exact = { total: 100, isTotalExact: true };

  it('treats an empty or non-numeric query as no jump', () => {
    expect(batchUtils.parseJumpTarget({ query: '  ', ...exact })).toEqual({
      kind: 'none',
    });
    expect(batchUtils.parseJumpTarget({ query: 'abc', ...exact })).toEqual({
      kind: 'invalid',
    });
    expect(batchUtils.parseJumpTarget({ query: '0', ...exact })).toEqual({
      kind: 'invalid',
    });
  });

  it('converts a batch number to a zero-based dispatch index', () => {
    expect(batchUtils.parseJumpTarget({ query: ' 7 ', ...exact })).toEqual({
      kind: 'index',
      dispatchIndex: 6,
    });
  });

  it('rejects out-of-range only when the total is exact', () => {
    expect(batchUtils.parseJumpTarget({ query: '101', ...exact })).toEqual({
      kind: 'outOfRange',
      total: 100,
    });
    expect(
      batchUtils.parseJumpTarget({
        query: '101',
        total: 100,
        isTotalExact: false,
      }),
    ).toEqual({ kind: 'index', dispatchIndex: 100 });
  });
});

describe('batchUtils.batchStatusBadge', () => {
  it('gives the four childless states their own colours', () => {
    expect(batchUtils.batchStatusBadge('failedToDispatch').variant).toBe(
      'destructive',
    );
    expect(batchUtils.batchStatusBadge('stillRunning').variant).toBe('accent');
    expect(batchUtils.batchStatusBadge('neverStarted').variant).toBe(
      'secondary',
    );
    expect(batchUtils.batchStatusBadge('logsExpired').variant).toBe('secondary');
    expect(batchUtils.batchStatusBadge('outcomeUnknown').variant).toBe(
      'secondary',
    );
  });

  it('reuses the run status vocabulary for batches that have a run', () => {
    expect(batchUtils.batchStatusBadge(FlowRunStatus.SUCCEEDED).variant).toBe(
      'success',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.FAILED).variant).toBe(
      'destructive',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.RUNNING).variant).toBe(
      'accent',
    );
  });
});

describe('batchUtils.failureMessage', () => {
  const friendly = (message: string, raw: string) =>
    JSON.stringify({ __apErrorVersion: 1, message, raw });

  it('unwraps a well-formed friendly piece error', () => {
    expect(batchUtils.failureMessage(friendly('Oops', 'Error: Oops'))).toBe(
      'Oops',
    );
  });

  it('recovers the message from an envelope the server truncated mid-string', () => {
    const truncated = friendly('Oops', 'Error: Oops at run…').slice(0, 60);
    expect(() => JSON.parse(truncated)).toThrow();
    expect(batchUtils.failureMessage(truncated)).toBe('Oops');
  });

  it('unescapes a recovered message', () => {
    const truncated = friendly('Bad "input"\non line 2', 'x'.repeat(80)).slice(
      0,
      70,
    );
    expect(batchUtils.failureMessage(truncated)).toBe('Bad "input"\non line 2');
  });

  it('passes plain text through and treats a missing message as none', () => {
    expect(batchUtils.failureMessage('Connection refused')).toBe(
      'Connection refused',
    );
    expect(batchUtils.failureMessage(undefined)).toBeNull();
  });
});
