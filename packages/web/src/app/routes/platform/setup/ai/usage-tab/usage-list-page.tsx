import { isNil } from '@activepieces/core-utils';
import {
  AI_USAGE_DIMENSIONS,
  AiUsageDimension,
  AiUsageHistory,
  AiUsageItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { AdminPageHeader, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { aiUsageHooks } from '@/features/ai-usage';
import { cn } from '@/lib/utils';

import { usageAdapters } from './usage-adapters';
import { DeltaChip, ItemIcon, USAGE_LIST_GRID, UsageTrail } from './usage-bits';
import { UsageEmpty } from './usage-empty';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsageListSkeleton } from './usage-skeletons';
import { SharedBadge } from './usage-top-list';

export function UsageListPage() {
  const { dimension: param } = useParams();
  const dimension = AI_USAGE_DIMENSIONS.find((item) => item === param);
  const view = useUsageView();
  const { data, isLoading, isError, refetch } = aiUsageHooks.useUsageItems({
    dimension,
    period: view.period,
    scope: view.scope,
  });
  if (isNil(dimension)) {
    return <Navigate to={`/platform/ai/usage${view.search}`} replace />;
  }
  const totalUsd = data?.itemsSpendUsd ?? 0;

  return (
    <>
      <AdminPageHeader
        title={
          <UsageTrail
            crumbs={[
              { label: t('AI usage'), to: `/platform/ai/usage${view.search}` },
            ]}
            current={usageFormat.dimensionLabel({ dimension })}
          />
        }
        description={
          data && data.count > 0
            ? t('{amount} across {items}', {
                amount: usageFormat.usd(totalUsd),
                items: usageFormat
                  .itemCountLabel({ dimension, count: data.count })
                  .toLowerCase(),
              })
            : undefined
        }
      >
        <UsageHeaderControls view={view} />
      </AdminPageHeader>
      <UsageListBody
        key={`${dimension}-${view.scope}-${view.period}`}
        view={view}
        dimension={dimension}
        items={data?.items ?? []}
        history={data?.history}
        totalUsd={totalUsd}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
    </>
  );
}

function UsageListBody({
  view,
  dimension,
  items,
  history,
  totalUsd,
  isLoading,
  isError,
  onRetry,
}: {
  view: UsageView;
  dimension: AiUsageDimension;
  items: AiUsageItem[];
  history: AiUsageHistory | undefined;
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<UsageSort>(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLElement>(null);
  const plural = usageFormat.dimensionLabel({ dimension }).toLowerCase();

  if (isError) {
    return <DataFetchErrorState entity={plural} onRetry={onRetry} />;
  }
  if (isLoading || isNil(history)) {
    return <UsageListSkeleton />;
  }
  if (items.length === 0) {
    return (
      <UsageEmpty
        view={view}
        history={history}
        title={t('No {item} spend in this period', {
          item: usageFormat.dimensionBadge({ dimension }).toLowerCase(),
        })}
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const matches = sortItems({
    items: items.filter((item) => {
      const name = usageAdapters.itemDisplayName({ item }).toLowerCase();
      return (
        needle.length === 0 ||
        name.includes(needle) ||
        (item.parent ?? '').toLowerCase().includes(needle)
      );
    }),
    sort,
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const changeSort = (next: UsageSort): void => {
    setSort(next);
    setPage(1);
  };
  const goTo = (next: number): void => {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <section
      ref={listRef}
      className={cn(adminSurface.card, 'flex scroll-mt-4 flex-col')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder={t('Search {items}', { items: plural })}
          />
        </div>
        <span className="px-1 text-xs tabular-nums text-gray-11">
          {needle.length === 0
            ? usageFormat.itemCountLabel({ dimension, count: items.length })
            : t('{shown} of {total}', {
                shown: usageFormat.whole(matches.length),
                total: usageFormat.itemCountLabel({
                  dimension,
                  count: items.length,
                }),
              })}
        </span>
      </div>
      <div
        className={cn(
          USAGE_LIST_GRID,
          'border-y border-gray-6 px-5 py-2 text-xs text-gray-11',
        )}
      >
        <SortHeader
          label={usageFormat.dimensionBadge({ dimension })}
          column="name"
          sort={sort}
          onSort={changeSort}
        />
        <SortHeader
          label={t('Change')}
          column="change"
          sort={sort}
          onSort={changeSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Calls')}
          column="calls"
          sort={sort}
          onSort={changeSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Tokens')}
          column="tokens"
          sort={sort}
          onSort={changeSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Spend')}
          column="spend"
          sort={sort}
          onSort={changeSort}
        />
        <span />
      </div>
      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
          <p className="text-sm text-gray-11">
            {t('No {items} match "{query}"', { items: plural, query })}
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuery('')}>
            {t('Clear search')}
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-6">
          {shown.map((item) => (
            <UsageListRow
              key={item.id}
              item={item}
              totalUsd={totalUsd}
              search={view.search}
            />
          ))}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-6 px-5 py-3">
          <span className="text-xs tabular-nums text-gray-11">
            {t('{from}–{to} of {total}', {
              from: usageFormat.whole((current - 1) * PAGE_SIZE + 1),
              to: usageFormat.whole((current - 1) * PAGE_SIZE + shown.length),
              total: usageFormat.whole(matches.length),
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={current === 1}
              onClick={() => goTo(current - 1)}
              aria-label={t('Previous page')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-20 text-center text-xs tabular-nums text-gray-11">
              {t('Page {page} of {pages}', {
                page: usageFormat.whole(current),
                pages: usageFormat.whole(pageCount),
              })}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={current === pageCount}
              onClick={() => goTo(current + 1)}
              aria-label={t('Next page')}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function UsageListRow({
  item,
  totalUsd,
  search,
}: {
  item: AiUsageItem;
  totalUsd: number;
  search: string;
}) {
  const share = totalUsd === 0 ? 0 : item.spendUsd / totalUsd;
  const name = usageAdapters.itemDisplayName({ item });
  return (
    <li>
      <Link
        to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
        className={cn(
          USAGE_LIST_GRID,
          'group px-5 py-3.5 transition-colors hover:bg-gray-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-gray-8/50',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-6 bg-gray-1">
            <ItemIcon item={item} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <TextWithTooltip tooltipMessage={name}>
                <p className="truncate text-sm font-medium text-gray-12">
                  {name}
                </p>
              </TextWithTooltip>
              {usageAdapters.hasSharedSpend({ item }) && (
                <SharedBadge item={item} />
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-xs text-gray-11">
                {usageAdapters.itemSubtitle({ item })}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-gray-3">
                    <span
                      className="block h-full rounded-full bg-accent-9"
                      style={{ width: `${Math.max(share * 100, 2)}%` }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  {t('{share} of all AI spend in this period', {
                    share: usageFormat.percent(share),
                  })}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <span className="hidden justify-end md:flex">
          {item.comparable ? (
            <DeltaChip
              value={usageFormat.change({
                current: item.spendUsd,
                previous: item.previousSpendUsd,
              })}
              size="xs"
            />
          ) : (
            <span className="text-xs text-gray-9">—</span>
          )}
        </span>
        <span className="hidden text-right text-sm tabular-nums text-gray-11 md:block">
          {usageFormat.whole(item.calls)}
        </span>
        <span className="hidden text-right text-sm tabular-nums text-gray-11 md:block">
          {usageFormat.compact(item.tokens)}
        </span>
        <span className="text-right text-sm font-medium tabular-nums text-gray-12">
          {usageFormat.usd(item.spendUsd)}
        </span>
        <ChevronRight className="size-4 text-gray-9 transition-colors group-hover:text-gray-11" />
      </Link>
    </li>
  );
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: UsageSortColumn;
  sort: UsageSort;
  onSort: (sort: UsageSort) => void;
  className?: string;
}) {
  const active = sort.column === column;
  const Arrow = sort.desc ? ArrowDown : ArrowUp;
  return (
    <span
      className={cn(
        'flex',
        column === 'name' ? 'justify-start' : 'justify-end',
        className,
      )}
    >
      <button
        type="button"
        onClick={() =>
          onSort({
            column,
            desc: active ? !sort.desc : column !== 'name',
          })
        }
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-sm transition-colors hover:text-gray-12 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50',
          active && 'font-medium text-gray-12',
        )}
      >
        {label}
        {active && <Arrow className="size-3" />}
      </button>
    </span>
  );
}

function sortItems({
  items,
  sort,
}: {
  items: AiUsageItem[];
  sort: UsageSort;
}): AiUsageItem[] {
  const direction = sort.desc ? -1 : 1;
  return [...items].sort((a, b) =>
    sort.column === 'name'
      ? direction *
        usageAdapters
          .itemDisplayName({ item: a })
          .localeCompare(usageAdapters.itemDisplayName({ item: b }))
      : direction *
        (sortValue({ item: a, column: sort.column }) -
          sortValue({ item: b, column: sort.column })),
  );
}

function sortValue({
  item,
  column,
}: {
  item: AiUsageItem;
  column: UsageSortColumn;
}): number {
  switch (column) {
    case 'name':
    case 'spend':
      return item.spendUsd;
    case 'change':
      return item.comparable
        ? usageFormat.change({
            current: item.spendUsd,
            previous: item.previousSpendUsd,
          })
        : Number.NEGATIVE_INFINITY;
    case 'calls':
      return item.calls;
    case 'tokens':
      return item.tokens;
  }
}

const PAGE_SIZE = 25;
const DEFAULT_SORT: UsageSort = { column: 'spend', desc: true };

type UsageSortColumn = 'name' | 'spend' | 'change' | 'calls' | 'tokens';
type UsageSort = { column: UsageSortColumn; desc: boolean };
