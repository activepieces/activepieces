import {
  isNil,
  tryCatchSync,
  tryParseFriendlyPieceError,
} from '@activepieces/core-utils';
import {
  BarrierSignalStatus,
  FAILED_STATES,
  FlowActionType,
  FlowRunStatus,
  FlowTriggerType,
  isFlowRunStateTerminal,
  MAX_INLINE_BARRIER_SIGNALS,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Archive,
  CircleX,
  Clock,
  LucideIcon,
  Minus,
  Timer,
} from 'lucide-react';
import { z } from 'zod';

import { StatusVariant } from '@/components/custom/status-icon-with-text';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { formatUtils } from '@/lib/format-utils';

function parseStepOutput(output: unknown): BatchStepRunOutput | null {
  const parsed = BatchStepRunOutput.safeParse(output);
  return parsed.success ? parsed.data : null;
}

function batchCount(output: BatchStepRunOutput): number {
  return output.total ?? Math.ceil(output.totalItems / output.batchSize);
}

function isSkippedWithoutBatches({
  stepType,
  stepOutput,
}: {
  stepType: FlowActionType | FlowTriggerType | undefined;
  stepOutput: unknown;
}): boolean {
  if (stepType !== FlowActionType.PROCESS_IN_BATCHES) {
    return false;
  }
  const output = parseStepOutput(stepOutput);
  return !isNil(output) && isNil(output.barrierId) && batchCount(output) === 0;
}

function missingLogsReason({
  output,
  dispatchIndex,
  child,
}: {
  output: BatchStepRunOutput;
  dispatchIndex: number;
  child: BatchChild | null;
}): BatchChildState {
  const counts = BatchSummaryCounts.safeParse(output);
  if (!isNil(child)) {
    if (
      isFlowRunStateTerminal({
        status: child.status,
        ignoreInternalError: false,
      })
    ) {
      return 'logsUnavailable';
    }
    return counts.success ? 'stillRunning' : 'pending';
  }
  if (!counts.success) {
    return 'pending';
  }
  if (output.signalsTruncated || isNil(output.signals)) {
    return counts.data.notDispatched === 0 ? 'neverStarted' : 'didNotRun';
  }
  const signal = output.signals.find(
    (candidate) => candidate.sequence === dispatchIndex,
  );
  switch (signal?.outcome) {
    case BarrierSignalStatus.NOT_DISPATCHED:
      return 'failedToDispatch';
    case undefined:
    case BarrierSignalStatus.PENDING:
      return 'neverStarted';
    default:
      return 'logsUnavailable';
  }
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
    unsuccessful: failed + rejected + canceled + notDispatched,
    stillRunning,
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
  if (from === to) {
    return t('item {number}', { number: formatUtils.formatNumber(from) });
  }
  return t('items {from}–{to}', {
    from: formatUtils.formatNumber(from),
    to: formatUtils.formatNumber(to),
  });
}

function parseJumpTarget({
  query,
  total,
}: {
  query: string;
  total: number;
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
  if (batchNumber > total) {
    return { kind: 'outOfRange', total };
  }
  return { kind: 'index', dispatchIndex: batchNumber - 1 };
}

function batchStatusBadge(
  status: FlowRunStatus | BatchChildState,
): BatchStatusBadge {
  switch (status) {
    case 'pending':
      return { variant: 'secondary', Icon: Clock, label: t('Pending') };
    case 'failedToDispatch':
      return {
        variant: 'destructive',
        Icon: CircleX,
        label: t('Failed to start'),
      };
    case 'stillRunning':
      return { variant: 'info', Icon: Timer, label: t('Still running') };
    case 'neverStarted':
      return { variant: 'secondary', Icon: Minus, label: t('Never started') };
    case 'didNotRun':
      return { variant: 'secondary', Icon: Minus, label: t('Did not run') };
    case 'logsUnavailable':
      return { variant: 'secondary', Icon: Archive, label: t('No logs') };
    default: {
      const { variant, Icon } = flowRunUtils.getStatusIcon(status);
      return {
        variant: RUN_VARIANT_TO_BADGE[variant],
        Icon,
        label:
          flowRunUtils.getStatusLabelOverride(status) ??
          formatUtils.convertEnumToHumanReadable(status),
      };
    }
  }
}

function failureMessage(message: string | undefined): string | null {
  if (isNil(message) || message.length === 0) {
    return null;
  }
  const parsed = tryParseFriendlyPieceError(message);
  if (!isNil(parsed)) {
    return parsed.message;
  }
  const recovered = TRUNCATED_FRIENDLY_ERROR.exec(message);
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
    case 'pending':
      return {
        title: t('This batch has not finished yet'),
        description: t('Its logs appear here when it finishes.'),
      };
    case 'neverStarted':
      return {
        title: t('This batch never started'),
        description: t(
          'The step stopped waiting before this batch was sent to run, so nothing in it ran.',
        ),
      };
    case 'failedToDispatch':
      return {
        title: t('This batch failed to start'),
        description: t('It could not be sent to run, so nothing in it ran.'),
      };
    case 'didNotRun':
      return {
        title: t('This batch did not run'),
        description: t(
          'This step ran more than {limit} batches, so the summary does not say whether this batch failed to start or never started. Either way, nothing in it ran.',
          { limit: formatUtils.formatNumber(MAX_INLINE_BARRIER_SIGNALS) },
        ),
      };
    case 'stillRunning':
      return {
        title: t('This batch is still running'),
        description: t(
          'The step stopped waiting for it, so its changes can still happen after the flow moved on.',
        ),
      };
    case 'logsUnavailable':
      return {
        title: t('This batch has no logs'),
        description: t(
          'It finished, but its logs are not available. They may be past the retention window, or the batch stopped before it wrote any.',
        ),
      };
    default:
      return null;
  }
}

const TRUNCATED_FRIENDLY_ERROR =
  /^\{\s*"__apErrorVersion"\s*:\s*\d+\s*,\s*"message"\s*:\s*("(?:[^"\\]|\\.)*")/;

const RUN_VARIANT_TO_BADGE: Record<StatusVariant, BatchStatusBadge['variant']> =
  {
    success: 'success',
    error: 'destructive',
    warning: 'warning',
    primary: 'info',
    default: 'info',
    neutral: 'secondary',
    secondary: 'secondary',
  };

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
        sequence: z.number().int().nullable(),
        outcome: z.enum(BarrierSignalStatus),
        runId: z.string().nullable(),
      }),
    )
    .optional()
    .catch(undefined),
  signalsTruncated: z.boolean().optional(),
});

export const batchUtils = {
  parseStepOutput,
  batchCount,
  isSkippedWithoutBatches,
  missingLogsReason,
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
  ...FAILED_STATES,
  FlowRunStatus.LOG_SIZE_EXCEEDED,
  FlowRunStatus.CANCELED,
];

export type BatchStepRunOutput = z.infer<typeof BatchStepRunOutput>;

export type BatchChild = {
  id: string;
  status: FlowRunStatus;
  dispatchIndex: number;
};

export type BatchChildState =
  | 'pending'
  | 'neverStarted'
  | 'failedToDispatch'
  | 'didNotRun'
  | 'stillRunning'
  | 'logsUnavailable';

export type BatchHeaderState =
  | { kind: 'unknown' }
  | { kind: 'pending'; total: number }
  | {
      kind: 'finished';
      total: number;
      succeeded: number;
      unsuccessful: number;
      stillRunning: number;
      timedOut: boolean;
    };

export type BatchJumpTarget =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'outOfRange'; total: number }
  | { kind: 'index'; dispatchIndex: number };

export type BatchStatusBadge = {
  variant: 'success' | 'destructive' | 'info' | 'secondary' | 'warning';
  Icon: LucideIcon;
  label: string;
};
