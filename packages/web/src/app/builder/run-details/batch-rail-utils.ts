import { isNil } from '@activepieces/core-utils';
import {
  BarrierSignalStatus,
  FlowActionType,
  FlowRunStatus,
  FlowTriggerType,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { z } from 'zod';

function parseStepOutput(output: unknown): BatchStepRunOutput | null {
  const parsed = BatchStepRunOutput.safeParse(output);
  return parsed.success ? parsed.data : null;
}

function batchCount(output: BatchStepRunOutput): number {
  return output.total ?? Math.ceil(output.totalItems / output.batchSize);
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
  return (output.signals ?? []).some(
    (signal) =>
      signal.sequence === batchIndex &&
      signal.outcome === BarrierSignalStatus.NOT_DISPATCHED,
  );
}

const BatchStepRunOutput = z.object({
  barrierId: z.string().nullable(),
  totalItems: z.number().int().nonnegative(),
  batchSize: z.number().int().positive(),
  total: z.number().int().nonnegative().optional(),
  signals: z
    .array(
      z.object({
        sequence: z.number().int().nonnegative().nullable(),
        outcome: z.enum(BarrierSignalStatus),
        runId: z.string().nullable(),
      }),
    )
    .optional(),
});

export const batchRailUtils = {
  parseStepOutput,
  batchCount,
  isSkippedOnEmptyItems,
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
