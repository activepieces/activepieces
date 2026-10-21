import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ChartLine, Search } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AdminDataTable, AdminPageHeader } from '@/app/components/admin';
import { DataWithId, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';

import { DeltaChip, ItemIcon } from './usage-bits';
import {
  USAGE_DIMENSIONS,
  usageDummyData,
  UsageDimension,
  UsageItem,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';
import { UsageToolbar, useUsageView } from './usage-header-controls';
import { UsagePreviewSwitcher } from './usage-preview-switcher';

export function UsageListPage() {
  const { dimension: param } = useParams();
  const dimension = USAGE_DIMENSIONS.find((item) => item === param);
  const view = useUsageView();
  const navigate = useNavigate();
  const rows = useMemo(
    () =>
      dimension === undefined || view.preset === 'empty'
        ? []
        : usageDummyData
            .buildList({
              period: view.period,
              scope: view.scope,
              preset: view.dataPreset,
              dimension,
            })
            .map((item) => ({
              ...item,
              change: usageFormat.change({
                current: item.spendUsd,
                previous: item.previousSpendUsd,
              }),
            })),
    [dimension, view.period, view.scope, view.dataPreset, view.preset],
  );
  if (dimension === undefined) {
    return <Navigate to={`/platform/ai/usage${view.search}`} replace />;
  }
  const totalUsd = rows.reduce((sum, row) => sum + row.spendUsd, 0);

  return (
    <>
      <AdminPageHeader
        back={{ to: `/platform/ai/usage${view.search}`, label: t('AI usage') }}
        title={usageFormat.dimensionLabel({ dimension })}
        description={
          view.preset === 'loading' || view.preset === 'error'
            ? undefined
            : t(
                '{count, plural, =1 {1 item} other {# items}} · {amount} in {period}',
                {
                  count: rows.length,
                  amount: usageFormat.usd(totalUsd),
                  period: usageFormat
                    .periodLabel({ period: view.period })
                    .toLowerCase(),
                },
              )
        }
      />
      <UsageToolbar
        view={view}
        exportRows={rows}
        exportSeries={[]}
        exportName={`ai-usage-${dimension}`}
      />
      <AdminDataTable
        columns={columnsFor({ dimension, totalUsd })}
        page={{ data: rows, next: null, previous: null }}
        isLoading={view.preset === 'loading'}
        isError={view.preset === 'error'}
        errorStateEntity={usageFormat
          .dimensionLabel({ dimension })
          .toLowerCase()}
        onRetry={() => view.setPreset('rich')}
        filters={[
          {
            type: 'input',
            title: t('Search by name'),
            accessorKey: 'name',
            icon: Search,
          },
        ]}
        clientFiltering
        clientPagination
        initialSorting={[{ id: 'spendUsd', desc: true }]}
        getRowId={(row) => row.id}
        onRowClick={(row, newWindow) => {
          const to = `/platform/ai/usage/${row.dimension}/${row.id}${view.search}`;
          if (newWindow) {
            window.open(to, '_blank', 'noopener');
            return;
          }
          navigate(to);
        }}
        emptyStateTextTitle={t('No AI usage in this period')}
        emptyStateTextDescription={t(
          'Pick a longer period, or switch to All to include test runs.',
        )}
        emptyStateIcon={<ChartLine />}
      />
      <UsagePreviewSwitcher view={view} />
    </>
  );
}

function columnsFor({
  dimension,
  totalUsd,
}: {
  dimension: UsageDimension;
  totalUsd: number;
}): ColumnDef<RowDataWithActions<UsageRow>, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={usageFormat.dimensionBadge({ dimension })}
          sortable
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ItemIcon item={row.original} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-gray-12">
              {row.original.name}
            </span>
            {row.original.parent && (
              <span className="truncate text-xs text-gray-11">
                {row.original.parent}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'spendUsd',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Spend')} sortable />
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-gray-12">
          {usageFormat.usd(row.original.spendUsd)}
        </span>
      ),
    },
    {
      accessorKey: 'change',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Change')} sortable />
      ),
      cell: ({ row }) =>
        row.original.comparable ? (
          <DeltaChip value={row.original.change} />
        ) : (
          <span className="text-xs text-gray-11">—</span>
        ),
    },
    {
      id: 'share',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Share')} />
      ),
      cell: ({ row }) => {
        const share = totalUsd === 0 ? 0 : row.original.spendUsd / totalUsd;
        return (
          <div className="flex min-w-32 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-3">
              <div
                className="h-full rounded-full bg-accent-9"
                style={{ width: `${Math.max(share * 100, 1)}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs tabular-nums text-gray-11">
              {usageFormat.percent(share)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'calls',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Calls')} sortable />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-12">
          {usageFormat.whole(row.original.calls)}
        </span>
      ),
    },
    {
      accessorKey: 'tokens',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Tokens')} sortable />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-12">
          {usageFormat.compact(row.original.tokens)}
        </span>
      ),
    },
  ];
}

type UsageRow = UsageItem & DataWithId & { change: number };
