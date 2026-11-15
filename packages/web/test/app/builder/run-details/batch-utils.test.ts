import { readFileSync } from 'fs';
import path from 'path';

import {
  BarrierSignalStatus,
  FlowActionType,
  FlowRunStatus,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import {
  BatchStepRunOutput,
  FAILED_BATCH_STATUSES,
  batchUtils,
} from '@/app/builder/run-details/batch-utils';

vi.mock('i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('i18next')>()),
  t: (key: string) => key,
}));

const pausedOutput: BatchStepRunOutput = {
  barrierId: 'barrier-id',
  totalItems: 5,
  batchSize: 2,
  total: 3,
};

const releasedOutput: BatchStepRunOutput = {
  ...pausedOutput,
  succeeded: 1,
  failed: 0,
  rejected: 0,
  canceled: 0,
  notDispatched: 1,
  stillRunning: 1,
  timedOut: true,
  signals: [
    { sequence: 0, outcome: BarrierSignalStatus.SUCCEEDED, runId: 'run-0' },
    { sequence: 1, outcome: BarrierSignalStatus.PENDING, runId: null },
    { sequence: 2, outcome: BarrierSignalStatus.NOT_DISPATCHED, runId: null },
  ],
};

const truncatedOutput: BatchStepRunOutput = {
  barrierId: 'barrier-id',
  totalItems: 300,
  batchSize: 2,
  total: 150,
  succeeded: 149,
  failed: 0,
  rejected: 0,
  canceled: 0,
  notDispatched: 0,
  stillRunning: 1,
  timedOut: true,
  signalsTruncated: true,
};

const emptyItemsOutput: BatchStepRunOutput = {
  barrierId: null,
  totalItems: 0,
  batchSize: 2,
  total: 0,
  succeeded: 0,
  failed: 0,
  rejected: 0,
  canceled: 0,
  notDispatched: 0,
  stillRunning: 0,
  timedOut: false,
  signals: [],
};

describe('batchUtils.parseStepOutput', () => {
  it('reads the paused output the step writes before it waits', () => {
    expect(batchUtils.parseStepOutput(pausedOutput)).toEqual(pausedOutput);
  });

  it('reads the released summary the step writes when it resumes', () => {
    expect(batchUtils.parseStepOutput(releasedOutput)).toEqual(releasedOutput);
  });

  it('keeps the counts when a signal carries an outcome it does not know', () => {
    const parsed = batchUtils.parseStepOutput({
      ...releasedOutput,
      signals: [{ sequence: 0, outcome: 'SOMETHING_NEW', runId: null }],
    });
    expect(parsed?.succeeded).toBe(1);
    expect(parsed?.signals).toBeUndefined();
  });

  it('ignores an output that is not a batch step run', () => {
    expect(batchUtils.parseStepOutput({ items: [1, 2] })).toBeNull();
    expect(batchUtils.parseStepOutput(undefined)).toBeNull();
  });
});

describe('batchUtils.batchCount', () => {
  it('counts the trailing partial batch when the output has no total', () => {
    expect(batchUtils.batchCount({ ...pausedOutput, total: undefined })).toBe(
      3,
    );
  });

  it('counts nothing when the items resolved empty', () => {
    expect(batchUtils.batchCount(emptyItemsOutput)).toBe(0);
  });

  it('trusts the reported total over the item arithmetic', () => {
    expect(batchUtils.batchCount({ ...pausedOutput, total: 0 })).toBe(0);
  });
});

describe('batchUtils.isSkippedWithoutBatches', () => {
  it('calls a batch step skipped when its items resolved empty', () => {
    expect(
      batchUtils.isSkippedWithoutBatches({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: emptyItemsOutput,
      }),
    ).toBe(true);
  });

  it('calls a batch step skipped when its body has no steps', () => {
    expect(
      batchUtils.isSkippedWithoutBatches({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: { ...emptyItemsOutput, totalItems: 5 },
      }),
    ).toBe(true);
  });

  it('does not call a dispatched batch step or another step type skipped', () => {
    expect(
      batchUtils.isSkippedWithoutBatches({
        stepType: FlowActionType.PROCESS_IN_BATCHES,
        stepOutput: pausedOutput,
      }),
    ).toBe(false);
    expect(
      batchUtils.isSkippedWithoutBatches({
        stepType: FlowActionType.LOOP_ON_ITEMS,
        stepOutput: emptyItemsOutput,
      }),
    ).toBe(false);
  });
});

describe('batchUtils.missingLogsReason', () => {
  it('calls every batch pending while the barrier still waits', () => {
    expect(
      batchUtils.missingLogsReason({
        output: pausedOutput,
        dispatchIndex: 2,
        child: null,
      }),
    ).toBe('pending');
    expect(
      batchUtils.missingLogsReason({
        output: pausedOutput,
        dispatchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.QUEUED, dispatchIndex: 0 },
      }),
    ).toBe('pending');
  });

  it('reads a childless batch from its signal once the barrier released', () => {
    expect(
      batchUtils.missingLogsReason({
        output: releasedOutput,
        dispatchIndex: 2,
        child: null,
      }),
    ).toBe('failedToDispatch');
    expect(
      batchUtils.missingLogsReason({
        output: releasedOutput,
        dispatchIndex: 1,
        child: null,
      }),
    ).toBe('neverStarted');
  });

  it('separates a straggler from a finished run without logs', () => {
    expect(
      batchUtils.missingLogsReason({
        output: releasedOutput,
        dispatchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.RUNNING, dispatchIndex: 0 },
      }),
    ).toBe('stillRunning');
    expect(
      batchUtils.missingLogsReason({
        output: releasedOutput,
        dispatchIndex: 0,
        child: { id: 'a', status: FlowRunStatus.SUCCEEDED, dispatchIndex: 0 },
      }),
    ).toBe('logsUnavailable');
  });

  it('uses the counts when the summary omitted its signals', () => {
    expect(
      batchUtils.missingLogsReason({
        output: truncatedOutput,
        dispatchIndex: 149,
        child: null,
      }),
    ).toBe('neverStarted');
    expect(
      batchUtils.missingLogsReason({
        output: { ...truncatedOutput, notDispatched: 1, stillRunning: 0 },
        dispatchIndex: 149,
        child: null,
      }),
    ).toBe('didNotRun');
  });

  it('has copy for every reason', () => {
    for (const reason of [
      'pending',
      'neverStarted',
      'failedToDispatch',
      'didNotRun',
      'stillRunning',
      'logsUnavailable',
    ] as const) {
      expect(batchUtils.missingLogsCopy(reason)).not.toBeNull();
    }
  });

  it('fills every placeholder its English copy names', () => {
    const translations: Record<string, string> = JSON.parse(
      readFileSync(
        path.resolve(
          __dirname,
          '../../../../public/locales/en/translation.json',
        ),
        'utf-8',
      ),
    );
    for (const reason of [
      'pending',
      'neverStarted',
      'failedToDispatch',
      'didNotRun',
      'stillRunning',
      'logsUnavailable',
    ] as const) {
      const copy = batchUtils.missingLogsCopy(reason);
      for (const key of [copy?.title ?? '', copy?.description ?? '']) {
        expect(placeholders(translations[key])).toEqual(placeholders(key));
      }
    }
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

  it('folds every unfavourable outcome into one unsuccessful count', () => {
    expect(
      batchUtils.headerState({
        ...releasedOutput,
        total: 10,
        totalItems: 20,
        succeeded: 5,
        failed: 2,
        rejected: 1,
        canceled: 1,
        notDispatched: 1,
        stillRunning: 0,
        timedOut: false,
      }),
    ).toEqual({
      kind: 'finished',
      total: 10,
      succeeded: 5,
      unsuccessful: 5,
      notDispatched: 1,
      stillRunning: 0,
      timedOut: false,
    });
  });

  it('carries the timed-out verdict so a partial release is not shown as a clean finish', () => {
    expect(batchUtils.headerState(releasedOutput)).toEqual({
      kind: 'finished',
      total: 3,
      succeeded: 1,
      unsuccessful: 1,
      notDispatched: 1,
      stillRunning: 1,
      timedOut: true,
    });
  });
});

describe('FAILED_BATCH_STATUSES', () => {
  it('lists every finished status except success, as the server counts a batch unsuccessful', () => {
    const unsuccessful = Object.values(FlowRunStatus).filter(
      (status) =>
        status !== FlowRunStatus.SUCCEEDED &&
        isFlowRunStateTerminal({ status, ignoreInternalError: false }),
    );
    expect([...FAILED_BATCH_STATUSES].sort()).toEqual(unsuccessful.sort());
  });
});

describe('batchUtils.itemRange', () => {
  const output = { ...pausedOutput, totalItems: 25, batchSize: 10 };

  it('derives the range from the batch size', () => {
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
    expect(batchUtils.itemRange({ output, dispatchIndex: 2 })).toEqual({
      from: 21,
      to: 25,
    });
  });

  it('names a single item instead of a range of one', () => {
    expect(
      batchUtils.itemRangeLabel({
        output: { ...output, batchSize: 1 },
        dispatchIndex: 4,
      }),
    ).toBe('item {number}');
    expect(batchUtils.itemRangeLabel({ output, dispatchIndex: 0 })).toBe(
      'items {from}–{to}',
    );
  });
});

describe('batchUtils.parseJumpTarget', () => {
  it('treats an empty query as no jump and a non-number as invalid', () => {
    expect(batchUtils.parseJumpTarget({ query: '  ', total: 100 })).toEqual({
      kind: 'none',
    });
    expect(batchUtils.parseJumpTarget({ query: 'abc', total: 100 })).toEqual({
      kind: 'invalid',
    });
    expect(batchUtils.parseJumpTarget({ query: '0', total: 100 })).toEqual({
      kind: 'invalid',
    });
  });

  it('converts a batch number to a zero-based dispatch index', () => {
    expect(batchUtils.parseJumpTarget({ query: ' 7 ', total: 100 })).toEqual({
      kind: 'index',
      dispatchIndex: 6,
    });
  });

  it('rejects a batch number past the last batch', () => {
    expect(batchUtils.parseJumpTarget({ query: '101', total: 100 })).toEqual({
      kind: 'outOfRange',
      total: 100,
    });
    expect(
      batchUtils.parseJumpTarget({
        query: '99999999999999999999',
        total: 100,
      }),
    ).toEqual({ kind: 'outOfRange', total: 100 });
  });
});

describe('batchUtils.batchStatusBadge', () => {
  it('gives each childless state its own colour', () => {
    expect(batchUtils.batchStatusBadge('failedToDispatch').variant).toBe(
      'destructive',
    );
    expect(batchUtils.batchStatusBadge('stillRunning').variant).toBe('info');
    for (const state of [
      'pending',
      'neverStarted',
      'didNotRun',
      'logsUnavailable',
    ] as const) {
      expect(batchUtils.batchStatusBadge(state).variant).toBe('secondary');
    }
  });

  it('keeps the run status colours for batches that have a run', () => {
    expect(batchUtils.batchStatusBadge(FlowRunStatus.SUCCEEDED).variant).toBe(
      'success',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.FAILED).variant).toBe(
      'destructive',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.RUNNING).variant).toBe(
      'info',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.CANCELED).variant).toBe(
      'secondary',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.QUEUED).variant).toBe(
      'secondary',
    );
    expect(batchUtils.batchStatusBadge(FlowRunStatus.PAUSED).variant).toBe(
      'warning',
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

  it('leaves a plain message that only quotes a JSON body untouched', () => {
    const plain = 'Request failed: {"message":"Not found","code":404}';
    expect(batchUtils.failureMessage(plain)).toBe(plain);
  });

  it('passes plain text through and treats a missing message as none', () => {
    expect(batchUtils.failureMessage('Connection refused')).toBe(
      'Connection refused',
    );
    expect(batchUtils.failureMessage(undefined)).toBeNull();
    expect(batchUtils.failureMessage('')).toBeNull();
  });
});

function placeholders(text: string | undefined): string[] {
  return [...(text ?? '').matchAll(/\{(\w+)\}/g)].map(([, name]) => name);
}
