import { isNil } from '@activepieces/core-utils';
import { FlowRun } from '@activepieces/shared';
import { t } from 'i18next';
import { CornerLeftUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  CardListEmpty,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { flowRunQueries } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

import {
  BATCH_PAGE_SIZE,
  BatchHeaderState,
  BatchStatusBadge,
  BatchStepRunOutput,
  FAILED_BATCH_STATUSES,
  batchUtils,
} from './batch-utils';
import { enclosingBatchStepName, useBatchStepRun } from './use-batch-logs';

export const BatchBrowser = ({ stepName }: { stepName: string }) => {
  const setBatchIndex = useBuilderStateContext((state) => state.setBatchIndex);
  const { output, total, current } = useBatchStepRun(stepName);
  const [query, setQuery] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);

  const header = batchUtils.headerState(output);
  const jumpTarget = batchUtils.parseJumpTarget({
    query,
    total,
    isTotalExact: header.kind === 'finished',
  });

  if (isNil(output)) {
    return <CardListItemSkeleton numberOfCards={5} withCircle={false} />;
  }
  if (total === 0) {
    return (
      <CardListEmpty
        message={t(
          'Items resolved to an empty array, so nothing ran. The flow continued to the next step.',
        )}
      />
    );
  }

  const select = (dispatchIndex: number) =>
    setBatchIndex({ stepName, index: dispatchIndex });

  return (
    <div className="flex flex-col gap-3">
      <BatchProgress header={header} output={output} />
      <BatchStatTiles header={header} />
      <div className="flex items-center gap-2 rounded-md border px-3 py-2">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && jumpTarget.kind === 'index') {
              select(jumpTarget.dispatchIndex);
            }
          }}
          placeholder={t('Find a batch by number…')}
          className="h-4 grow border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Badge
          asChild
          variant={failedOnly ? 'destructive' : 'outline'}
          className="shrink-0 cursor-pointer px-2 py-0.5 font-semibold"
        >
          <button type="button" onClick={() => setFailedOnly(!failedOnly)}>
            {t('Failed only')}
          </button>
        </Badge>
      </div>
      {jumpTarget.kind === 'invalid' && (
        <span className="text-xs text-muted-foreground">
          {t('Search by batch number')}
        </span>
      )}
      {jumpTarget.kind === 'outOfRange' && (
        <span className="text-xs text-destructive">
          {t('Only {total} batches', {
            total: formatUtils.formatNumber(jumpTarget.total),
          })}
        </span>
      )}
      {jumpTarget.kind === 'index' ? (
        <JumpedBatch
          output={output}
          dispatchIndex={jumpTarget.dispatchIndex}
          isFinished={header.kind === 'finished'}
          selectedIndex={current}
          onSelect={select}
        />
      ) : (
        <BatchList
          output={output}
          failedOnly={failedOnly}
          selectedIndex={current}
          onSelect={select}
        />
      )}
      <BatchDetail output={output} dispatchIndex={current} />
    </div>
  );
};

export const BatchBreadcrumb = ({ stepName }: { stepName: string }) => {
  const [trigger, selectStepByName] = useBuilderStateContext((state) => [
    state.flowVersion.trigger,
    state.selectStepByName,
  ]);
  const batchStepName = useMemo(
    () => enclosingBatchStepName({ stepName, trigger }),
    [stepName, trigger],
  );
  const { output, total, current } = useBatchStepRun(batchStepName);

  if (isNil(batchStepName) || isNil(output)) {
    return <></>;
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
      <CornerLeftUp className="size-3.5 shrink-0" />
      <span>
        {t('Reading Batch {number} of {total}', {
          number: formatUtils.formatNumber(current + 1),
          total: formatUtils.formatNumber(total),
        })}
      </span>
      <span className="truncate font-mono">
        {batchUtils.itemRangeLabel({ output, dispatchIndex: current })}
      </span>
      <button
        type="button"
        className="ml-auto shrink-0 text-primary underline"
        onClick={() => selectStepByName(batchStepName)}
      >
        {t('Browse batches')}
      </button>
    </div>
  );
};

const BatchProgress = ({
  header,
  output,
}: {
  header: BatchHeaderState;
  output: BatchStepRunOutput;
}) => (
  <div className="flex flex-col gap-2">
    <div
      className={cn(
        'h-2 rounded-full',
        header.kind === 'finished' ? 'bg-muted' : 'animate-pulse bg-primary/30',
      )}
      style={
        header.kind === 'finished'
          ? { backgroundImage: progressGradient(header) }
          : undefined
      }
    />
    <span className="text-xs text-muted-foreground">
      {t('Split {items} items, {size} each', {
        items: formatUtils.formatNumber(output.totalItems),
        size: formatUtils.formatNumber(output.batchSize),
      })}
    </span>
    {header.kind === 'finished' && header.timedOut && (
      <span className="text-xs text-warning-700 dark:text-warning-300">
        {t('Stopped waiting after the timeout, with {running} still running', {
          running: formatUtils.formatNumber(header.running),
        })}
      </span>
    )}
  </div>
);

const BatchStatTiles = ({ header }: { header: BatchHeaderState }) => {
  if (header.kind === 'unknown') {
    return <></>;
  }
  if (header.kind === 'pending') {
    return (
      <span className="text-sm font-semibold">
        {t('{total} batches · still running', {
          total: formatUtils.formatNumber(header.total),
        })}
      </span>
    );
  }
  const tiles = [
    {
      label: t('Expected'),
      value: header.total,
      tone: 'text-foreground',
      dot: null,
    },
    {
      label: t('Succeeded'),
      value: header.succeeded,
      tone: 'text-success-700 dark:text-success-300',
      dot: 'bg-success',
    },
    {
      label: t('Failed'),
      value: header.failed,
      tone: 'text-destructive-700 dark:text-destructive-300',
      dot: 'bg-destructive',
    },
    {
      label: t('Running'),
      value: header.running,
      tone: 'text-primary',
      dot: 'bg-primary',
    },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col gap-1 rounded-lg border bg-background p-2"
        >
          <span className={cn('text-lg font-semibold leading-none', tile.tone)}>
            {formatUtils.formatNumber(tile.value)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {!isNil(tile.dot) && (
              <i className={cn('size-1.5 shrink-0 rounded-full', tile.dot)} />
            )}
            {tile.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const BatchList = ({
  output,
  failedOnly,
  selectedIndex,
  onSelect,
}: {
  output: BatchStepRunOutput;
  failedOnly: boolean;
  selectedIndex: number;
  onSelect: (dispatchIndex: number) => void;
}) => {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = flowRunQueries.useBatchChildrenPage({
    barrierId: output.barrierId,
    limit: BATCH_PAGE_SIZE,
    statuses: failedOnly ? FAILED_BATCH_STATUSES : undefined,
    enabled: true,
    isDispatchComplete: batchUtils.isDispatchComplete(output),
  });

  const rows: BatchListItem[] = useMemo(() => {
    const seen = new Set<string>();
    const children = (data?.pages.flatMap((page) => page.data) ?? []).filter(
      (run) => {
        if (seen.has(run.id) || isNil(run.dispatchIndex)) {
          return false;
        }
        seen.add(run.id);
        return true;
      },
    );
    const items: BatchListItem[] = children.map((run) => ({
      type: 'batch' as const,
      run,
    }));
    return hasNextPage
      ? [...items, { type: 'loadMore' as const, id: 'loadMore' }]
      : items;
  }, [data, hasNextPage]);

  if (isLoading) {
    return <CardListItemSkeleton numberOfCards={5} withCircle={false} />;
  }
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border p-4">
        <span className="text-xs text-muted-foreground">
          {t('Error, please try again.')}
        </span>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t('Retry')}
        </Button>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="py-8">
        <CardListEmpty
          message={failedOnly ? t('No failed batches') : t('No batches found')}
        />
      </div>
    );
  }

  return (
    <VirtualizedScrollArea
      className="h-[280px] w-full rounded-lg border"
      items={rows}
      estimateSize={() => BATCH_ROW_HEIGHT}
      getItemKey={(index) => index}
      renderItem={(item) => {
        if (item.type === 'batch') {
          return (
            <BatchRow
              output={output}
              run={item.run}
              isSelected={item.run.dispatchIndex === selectedIndex}
              onSelect={onSelect}
            />
          );
        }
        return (
          <div className="flex h-full items-center px-2">
            <Button
              className="w-full"
              variant="accent"
              size="sm"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              {isFetchNextPageError ? t('Retry') : t('More...')}
            </Button>
          </div>
        );
      }}
    />
  );
};

const JumpedBatch = ({
  output,
  dispatchIndex,
  isFinished,
  selectedIndex,
  onSelect,
}: {
  output: BatchStepRunOutput;
  dispatchIndex: number;
  isFinished: boolean;
  selectedIndex: number;
  onSelect: (dispatchIndex: number) => void;
}) => {
  const { data, isLoading } = flowRunQueries.useBatchChild({
    barrierId: output.barrierId,
    dispatchIndex,
    enabled: true,
    isDispatchComplete: batchUtils.isDispatchComplete(output),
  });
  const run = data?.data[0] ?? null;

  if (isLoading) {
    return <CardListItemSkeleton numberOfCards={1} withCircle={false} />;
  }
  if (isNil(run) && !isFinished) {
    return (
      <div className="rounded-lg border p-4 text-xs text-muted-foreground">
        {t('Batch {number} not found', {
          number: formatUtils.formatNumber(dispatchIndex + 1),
        })}
      </div>
    );
  }
  return (
    <div className="rounded-lg border">
      <div style={{ height: BATCH_ROW_HEIGHT }}>
        <BatchRow
          output={output}
          run={run}
          fallbackDispatchIndex={dispatchIndex}
          isSelected={dispatchIndex === selectedIndex}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
};

const BatchRow = ({
  output,
  run,
  fallbackDispatchIndex,
  isSelected,
  onSelect,
}: {
  output: BatchStepRunOutput;
  run: FlowRun | null;
  fallbackDispatchIndex?: number;
  isSelected: boolean;
  onSelect: (dispatchIndex: number) => void;
}) => {
  const dispatchIndex = run?.dispatchIndex ?? fallbackDispatchIndex ?? 0;
  const badge = batchUtils.batchStatusBadge(
    isNil(run)
      ? batchUtils.childState({
          output,
          batchIndex: dispatchIndex,
          child: null,
        })
      : run.status,
  );
  return (
    <button
      type="button"
      onClick={() => onSelect(dispatchIndex)}
      className={cn(
        'flex h-full w-full items-center gap-2 border-b px-2 text-left last:border-b-0 hover:bg-accent',
        isSelected && 'border-primary/20 bg-primary/8 hover:bg-primary/8',
      )}
    >
      <span className="w-[60px] shrink-0 text-xs font-semibold">
        {t('Batch {number}', {
          number: formatUtils.formatNumber(dispatchIndex + 1),
        })}
      </span>
      <span className="grow truncate font-mono text-xs text-muted-foreground">
        {batchUtils.itemRangeLabel({ output, dispatchIndex })}
      </span>
      <span className="w-[52px] shrink-0 text-right text-xs text-muted-foreground">
        {runDuration(run) ?? '—'}
      </span>
      <StatusBadge badge={badge} />
    </button>
  );
};

const BatchDetail = ({
  output,
  dispatchIndex,
}: {
  output: BatchStepRunOutput;
  dispatchIndex: number;
}) => {
  const { data } = flowRunQueries.useBatchChild({
    barrierId: output.barrierId,
    dispatchIndex,
    enabled: true,
    isDispatchComplete: batchUtils.isDispatchComplete(output),
  });
  const run = data?.data[0] ?? null;
  const state = batchUtils.childState({
    output,
    batchIndex: dispatchIndex,
    child: null,
  });
  const badge = batchUtils.batchStatusBadge(isNil(run) ? state : run.status);
  const missingCopy = isNil(run) ? batchUtils.missingLogsCopy(state) : null;
  const duration = runDuration(run);
  const failure = batchUtils.failureMessage(run?.failedStep?.message);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <StatusBadge badge={badge} />
        <span className="text-sm font-semibold">
          {t('Batch {number}', {
            number: formatUtils.formatNumber(dispatchIndex + 1),
          })}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {batchUtils.itemRangeLabel({ output, dispatchIndex })}
        </span>
        {!isNil(duration) && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {t('took {duration}', { duration })}
          </span>
        )}
      </div>
      {!isNil(missingCopy) && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">{missingCopy.title}</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {missingCopy.description}
          </span>
        </div>
      )}
      {!isNil(run?.failedStep) && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-destructive-700 dark:text-destructive-300">
            {run.failedStep.displayName}
          </span>
          {!isNil(failure) && (
            <span className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-muted-foreground">
              {failure}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ badge }: { badge: BatchStatusBadge }) => (
  <Badge variant={badge.variant} className="shrink-0">
    <badge.Icon />
    {badge.label}
  </Badge>
);

function progressGradient({
  total,
  succeeded,
  failed,
  running,
}: {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
}): string {
  let cursor = 0;
  const stops = [
    { color: 'hsl(var(--success))', value: succeeded },
    { color: 'hsl(var(--destructive))', value: failed },
    { color: 'hsl(var(--primary))', value: running },
  ].flatMap(({ color, value }) => {
    if (value === 0) {
      return [];
    }
    const from = cursor;
    cursor += (value / total) * 100;
    return [`${color} ${from}% ${cursor}%`];
  });
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function runDuration(run: FlowRun | null): string | null {
  if (isNil(run?.startTime) || isNil(run.finishTime)) {
    return null;
  }
  return formatUtils.formatDuration(
    new Date(run.finishTime).getTime() - new Date(run.startTime).getTime(),
    true,
  );
}

const BATCH_ROW_HEIGHT = 36;

type BatchListItem =
  | { type: 'batch'; run: FlowRun }
  | { type: 'loadMore'; id: 'loadMore' };
