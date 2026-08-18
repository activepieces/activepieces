import {
  isNil,
  tryCatchSync,
  tryParseFriendlyPieceError,
} from '@activepieces/core-utils';
import {
  BarrierSignalStatus,
  FlowActionType,
  FlowRunStatus,
  FlowTriggerType,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Archive, CircleX, LucideIcon, Minus, Timer } from 'lucide-react';
import { z } from 'zod';

import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { formatUtils } from '@/lib/format-utils';

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

function headerState(output: BatchStepRunOutput | null): BatchHeaderState {
  if (isNil(output)) {
    return { kind: 'unknown' };
  }
  const total = batchCount(output);
  const counts = BatchSummaryCounts.safeParse(output);
  if (!counts.success) {
    return { kind: 'pending', total };
  }
  const {
    succeeded,
    failed,
    rejected,
    canceled,
    notDispatched,
    stillRunning,
    timedOut,
  } = counts.data;
  return {
    kind: 'finished',
    total,
    succeeded,
    failed: failed + rejected + canceled + notDispatched,
    running: stillRunning,
    timedOut,
  };
}

function itemRange({
  output,
  dispatchIndex,
}: {
  output: BatchStepRunOutput;
  dispatchIndex: number;
}): { from: number; to: number } {
  const from = dispatchIndex * output.batchSize + 1;
  return {
    from,
    to: Math.min((dispatchIndex + 1) * output.batchSize, output.totalItems),
  };
}

function itemRangeLabel({
  output,
  dispatchIndex,
}: {
  output: BatchStepRunOutput;
  dispatchIndex: number;
}): string {
  const { from, to } = itemRange({ output, dispatchIndex });
  return t('items {from}–{to}', {
    from: formatUtils.formatNumber(from),
    to: formatUtils.formatNumber(to),
  });
}

function parseJumpTarget({
  query,
  total,
  isTotalExact,
}: {
  query: string;
  total: number;
  isTotalExact: boolean;
}): BatchJumpTarget {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { kind: 'none' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { kind: 'invalid' };
  }
  const batchNumber = Number(trimmed);
  if (batchNumber < 1) {
    return { kind: 'invalid' };
  }
  if (isTotalExact && batchNumber > total) {
    return { kind: 'outOfRange', total };
  }
  return { kind: 'index', dispatchIndex: batchNumber - 1 };
}

function batchStatusBadge(
  status: FlowRunStatus | BatchChildState,
): BatchStatusBadge {
  switch (status) {
    case 'failedToDispatch':
      return {
        variant: 'destructive',
        Icon: CircleX,
        label: t('Failed to dispatch'),
      };
    case 'stillRunning':
      return { variant: 'accent', Icon: Timer, label: t('Still running') };
    case 'neverStarted':
      return { variant: 'secondary', Icon: Minus, label: t('Never started') };
    case 'logsExpired':
      return { variant: 'secondary', Icon: Archive, label: t('Logs expired') };
    default: {
      const { variant, Icon } = flowRunUtils.getStatusIcon(status);
      return {
        variant:
          variant === 'success'
            ? 'success'
            : variant === 'error'
            ? 'destructive'
            : 'accent',
        Icon,
        label:
          flowRunUtils.getStatusLabelOverride(status) ??
          formatUtils.convertEnumToHumanReadable(status),
      };
    }
  }
}

function failureMessage(message: string | undefined): string | null {
  if (isNil(message)) {
    return null;
  }
  const parsed = tryParseFriendlyPieceError(message);
  if (!isNil(parsed)) {
    return parsed.message;
  }
  const recovered = /"message"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(message);
  if (isNil(recovered)) {
    return message;
  }
  const [, quoted] = recovered;
  const { data: unescaped, error } = tryCatchSync(() => JSON.parse(quoted));
  return isNil(error) && typeof unescaped === 'string' ? unescaped : message;
}

function missingLogsCopy(
  kind: BatchChildState | 'notInABatch' | 'loading' | 'steps',
): { title: string; description: string } | null {
  switch (kind) {
    case 'neverStarted':
      return {
        title: t('This batch never started'),
        description: t(
          'It was never picked up by a worker, so it has no logs of its own.',
        ),
      };
    case 'failedToDispatch':
      return {
        title: t('This batch failed to dispatch'),
        description: t(
          'It was never handed to a worker, so it has no logs of its own.',
        ),
      };
    case 'stillRunning':
      return {
        title: t('This batch is still running'),
        description: t(
          'The parent finished without it, and its writes may still land.',
        ),
      };
    case 'logsExpired':
      return {
        title: t('Logs no longer available'),
        description: t(
          'This batch ran, but its logs are past the retention window. The summary on the step above is what remains.',
        ),
      };
    default:
      return null;
  }
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

const BatchSummaryCounts = z.object({
  succeeded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  canceled: z.number().int().nonnegative(),
  notDispatched: z.number().int().nonnegative(),
  stillRunning: z.number().int().nonnegative(),
  timedOut: z.boolean().default(false),
});

const BatchStepRunOutput = z.object({
  barrierId: z.string().nullable(),
  totalItems: z.number().int().nonnegative(),
  batchSize: z.number().int().positive(),
  total: z.number().int().nonnegative().optional(),
  succeeded: z.number().int().nonnegative().optional(),
  failed: z.number().int().nonnegative().optional(),
  rejected: z.number().int().nonnegative().optional(),
  canceled: z.number().int().nonnegative().optional(),
  notDispatched: z.number().int().nonnegative().optional(),
  stillRunning: z.number().int().nonnegative().optional(),
  timedOut: z.boolean().optional(),
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

export const batchUtils = {
  parseStepOutput,
  batchCount,
  isSkippedOnEmptyItems,
  childState,
  headerState,
  itemRange,
  itemRangeLabel,
  parseJumpTarget,
  batchStatusBadge,
  failureMessage,
  missingLogsCopy,
};

export const BATCH_PAGE_SIZE = 50;

export const FAILED_BATCH_STATUSES = [
  FlowRunStatus.FAILED,
  FlowRunStatus.INTERNAL_ERROR,
  FlowRunStatus.TIMEOUT,
  FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
  FlowRunStatus.QUOTA_EXCEEDED,
  FlowRunStatus.LOG_SIZE_EXCEEDED,
];

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

export type BatchHeaderState =
  | { kind: 'unknown' }
  | { kind: 'pending'; total: number }
  | {
      kind: 'finished';
      total: number;
      succeeded: number;
      failed: number;
      running: number;
      timedOut: boolean;
    };

export type BatchJumpTarget =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'outOfRange'; total: number }
  | { kind: 'index'; dispatchIndex: number };

export type BatchStatusBadge = {
  variant: 'success' | 'destructive' | 'accent' | 'secondary';
  Icon: LucideIcon;
  label: string;
};
