import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  FlowRunStatus,
  FlowTriggerType,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { z } from 'zod';

import { RailDotStatus } from './iteration-rail-utils';

function parseStepOutput(output: unknown): BatchStepRunOutput | null {
  const parsed = BatchStepRunOutput.safeParse(output);
  return parsed.success ? parsed.data : null;
}

function batchCount(output: BatchStepRunOutput): number {
  return output.expected ?? Math.ceil(output.totalItems / output.batchSize);
}

function isSkippedOnEmptyItems({
  stepType,
  stepOutput,
}: {
  stepType: FlowActionType | FlowTriggerType | undefined;
  stepOutput: unknown;
}): boolean {
  return (
    stepType === FlowActionType.PROCESS_IN_BATCHES &&
    parseStepOutput(stepOutput)?.totalItems === 0
  );
}

function itemRange({
  output,
  batchIndex,
}: {
  output: BatchStepRunOutput;
  batchIndex: number;
}): { from: number; to: number } {
  const from = batchIndex * output.batchSize;
  return {
    from: from + 1,
    to: Math.min(from + output.batchSize, output.totalItems),
  };
}

function dotStatuses({
  output,
  children,
}: {
  output: BatchStepRunOutput;
  children: BatchChild[];
}): RailDotStatus[] {
  const childByIndex = new Map(
    children.map((child) => [child.dispatchIndex, child.status]),
  );
  return Array.from({ length: batchCount(output) }, (_, batchIndex) => {
    const childStatus = childByIndex.get(batchIndex);
    if (!isNil(childStatus)) {
      return fromRunStatus(childStatus);
    }
    return failedToDispatchAt({ output, batchIndex })
      ? 'failedToDispatch'
      : 'neverStarted';
  });
}

function childState({
  output,
  batchIndex,
  child,
}: {
  output: BatchStepRunOutput;
  batchIndex: number;
  child: BatchChild | null;
}): BatchChildState {
  if (!isNil(child)) {
    return isFlowRunStateTerminal({
      status: child.status,
      ignoreInternalError: false,
    })
      ? 'logsExpired'
      : 'stillRunning';
  }
  return failedToDispatchAt({ output, batchIndex })
    ? 'failedToDispatch'
    : 'neverStarted';
}

function failedToDispatchAt({
  output,
  batchIndex,
}: {
  output: BatchStepRunOutput;
  batchIndex: number;
}): boolean {
  return (
    (output.failedToDispatchIndices ?? []).includes(batchIndex) ||
    (output.exceptions ?? []).some(
      (exception) =>
        exception.batchIndex === batchIndex &&
        exception.status === 'failedToDispatch',
    )
  );
}

function fromRunStatus(status: FlowRunStatus): RailDotStatus {
  if (status === FlowRunStatus.SUCCEEDED || status === FlowRunStatus.CANCELED) {
    return 'succeeded';
  }
  return isFlowRunStateTerminal({ status, ignoreInternalError: false })
    ? 'failed'
    : 'running';
}

const BatchStepRunOutput = z.object({
  barrierId: z.string().nullable(),
  totalItems: z.number().int().nonnegative(),
  batchSize: z.number().int().positive(),
  expected: z.number().int().nonnegative().optional(),
  failedToDispatchIndices: z.array(z.number().int().nonnegative()).optional(),
  exceptions: z
    .array(
      z.object({
        batchIndex: z.number().int().nonnegative(),
        status: z.enum(['failed', 'notStarted', 'failedToDispatch']),
        childRunId: z.string().nullable(),
      }),
    )
    .optional(),
});

export const batchRailUtils = {
  parseStepOutput,
  batchCount,
  isSkippedOnEmptyItems,
  itemRange,
  dotStatuses,
  childState,
};

export type BatchStepRunOutput = z.infer<typeof BatchStepRunOutput>;

export type BatchChild = {
  id: string;
  status: FlowRunStatus;
  dispatchIndex: number;
};

export type BatchChildState =
  | 'neverStarted'
  | 'failedToDispatch'
  | 'stillRunning'
  | 'logsExpired';
