import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { AdminPageHeader, adminSurface } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  DeltaChip,
  ItemIcon,
  itemSubtitle,
  UsageEmptyState,
} from './usage-bits';
import {
  USAGE_DIMENSIONS,
  usageDummyData,
  UsageDimension,
  UsageItem,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsagePreviewSwitcher } from './usage-preview-switcher';
import { SharedBadge } from './usage-top-list';

export function UsageListPage() {
  const { dimension: param } = useParams();
  const dimension = USAGE_DIMENSIONS.find((item) => item === param);
  const view = useUsageView();
  const items = useMemo(
    () =>
      isNil(dimension) || view.preset === 'empty'
        ? []
        : usageDummyData.buildList({
            period: view.period,
            scope: view.scope,
            preset: view.dataPreset,
            dimension,
          }),
    [dimension, view.period, view.scope, view.dataPreset, view.preset],
  );
  if (isNil(dimension)) {
    return <Navigate to={`/platform/ai/usage${view.search}`} replace />;
  }
  const totalUsd = items.reduce((sum, item) => sum + item.spendUsd, 0);
  const ready = view.preset !== 'loading' && view.preset !== 'error';

  return (
    <>
      <AdminPageHeader
        back={{ to: `/platform/ai/usage${view.search}`, label: t('AI usage') }}
        title={usageFormat.dimensionLabel({ dimension })}
        description={
          ready && items.length > 0
            ? t('{amount} across {items}', {
                amount: usageFormat.usd(totalUsd),
                items: itemCount({ dimension, count: items.length }),
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
        items={items}
        totalUsd={totalUsd}
      />
      <UsagePreviewSwitcher view={view} />
    </>
  );
}

function UsageListBody({
  view,
  dimension,
  items,
  totalUsd,
}: {
  view: UsageView;
  dimension: UsageDimension;
  items: UsageItem[];
  totalUsd: number;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<UsageSort>(DEFAULT_SORT);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const plural = usageFormat.dimensionLabel({ dimension }).toLowerCase();

  if (view.preset === 'loading') {
    return (
      <section className={cn(adminSurface.card, 'flex flex-col p-2')}>
        {SKELETON_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 px-3 py-3.5">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-1 w-48" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </section>
    );
  }
  if (view.preset === 'error') {
    return (
      <DataFetchErrorState
        entity={plural}
        onRetry={() => view.setPreset('rich')}
      />
    );
  }
  if (items.length === 0) {
    return (
      <section className={cn(adminSurface.card, 'p-5')}>
        <UsageEmptyState dimension={dimension} />
      </section>
    );
  }

  const needle = query.trim().toLowerCase();
  const matches = sortItems({
    items: items.filter(
      (item) =>
        needle.length === 0 ||
        item.name.toLowerCase().includes(needle) ||
        (item.parent ?? '').toLowerCase().includes(needle),
    ),
    sort,
  });
  const shown = matches.slice(0, visible);

  return (
    <section className={cn(adminSurface.card, 'flex flex-col')}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={query}
            onChange={(value) => {
              setQuery(value);
              setVisible(PAGE_SIZE);
            }}
            placeholder={t('Search {items}', { items: plural })}
          />
        </div>
        <span className="px-1 text-xs tabular-nums text-gray-11">
          {needle.length === 0
            ? itemCount({ dimension, count: items.length })
            : t('{shown} of {total}', {
                shown: usageFormat.whole(matches.length),
                total: itemCount({ dimension, count: items.length }),
              })}
        </span>
      </div>
      <div
        className={cn(
          ROW_GRID,
          'border-y border-gray-6 px-5 py-2 text-xs text-gray-11',
        )}
      >
        <SortHeader
          label={usageFormat.dimensionBadge({ dimension })}
          column="name"
          sort={sort}
          onSort={setSort}
        />
        <SortHeader
          label={t('Change')}
          column="change"
          sort={sort}
          onSort={setSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Calls')}
          column="calls"
          sort={sort}
          onSort={setSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Tokens')}
          column="tokens"
          sort={sort}
          onSort={setSort}
          className="hidden md:flex"
        />
        <SortHeader
          label={t('Spend')}
          column="spend"
          sort={sort}
          onSort={setSort}
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
      {matches.length > shown.length && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-6 px-5 py-3">
          <span className="text-xs tabular-nums text-gray-11">
            {t('Showing {shown} of {total}', {
              shown: usageFormat.whole(shown.length),
              total: usageFormat.whole(matches.length),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible(visible + PAGE_SIZE)}
          >
            {t('Show more')}
          </Button>
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
  item: UsageItem;
  totalUsd: number;
  search: string;
}) {
  const share = totalUsd === 0 ? 0 : item.spendUsd / totalUsd;
  return (
    <li>
      <Link
        to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
        className={cn(
          ROW_GRID,
          'group px-5 py-3.5 transition-colors hover:bg-gray-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-gray-8/50',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-6 bg-gray-1">
            <ItemIcon item={item} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <TextWithTooltip tooltipMessage={item.name}>
                <p className="truncate text-sm font-medium text-gray-12">
                  {item.name}
                </p>
              </TextWithTooltip>
              {!isNil(item.sharedWith) && <SharedBadge item={item} />}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-xs text-gray-11">
                {itemSubtitle({ item })}
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
  items: UsageItem[];
  sort: UsageSort;
}): UsageItem[] {
  const direction = sort.desc ? -1 : 1;
  return [...items].sort((a, b) =>
    sort.column === 'name'
      ? direction * a.name.localeCompare(b.name)
      : direction *
        (sortValue({ item: a, column: sort.column }) -
          sortValue({ item: b, column: sort.column })),
  );
}

function sortValue({
  item,
  column,
}: {
  item: UsageItem;
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

function itemCount({
  dimension,
  count,
}: {
  dimension: UsageDimension;
  count: number;
}): string {
  const noun =
    count === 1
      ? usageFormat.dimensionBadge({ dimension })
      : usageFormat.dimensionLabel({ dimension });
  return `${usageFormat.whole(count)} ${noun.toLowerCase()}`;
}

const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_6rem_1rem] items-center gap-4 md:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem_6rem_1rem]';
const PAGE_SIZE = 25;
const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e'];
const DEFAULT_SORT: UsageSort = { column: 'spend', desc: true };

type UsageSortColumn = 'name' | 'spend' | 'change' | 'calls' | 'tokens';
type UsageSort = { column: UsageSortColumn; desc: boolean };
