import { TriggerStatusReport } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Zap } from 'lucide-react';

import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DayBar, DayBars } from '@/components/custom/day-bars';
import { NumberCell } from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';
import { Page } from '@/components/custom/page';
import { StatusDot } from '@/components/custom/status-dot';
import { triggerRunHooks } from '@/features/flows';
import { PieceDisplayName, PieceIconWithPieceName } from '@/features/pieces';

import { HealthHeader } from '../health/components/health-header';

export default function TriggerHealthPage() {
  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = triggerRunHooks.useStatusReport();
  const days = lastDays(14);
  const rows = Object.entries(report?.pieces ?? {}).map(([pieceName, stats]) =>
    toRow({ pieceName, stats, days }),
  );

  return (
    <Page>
      <HealthHeader />
      <AdminTabs section="health" />
      <DataTable
        columns={COLUMNS}
        page={{ data: rows, next: null, previous: null }}
        hidePagination
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('trigger health')}
        onRetry={refetch}
        emptyStateTextTitle={t('No trigger runs yet')}
        emptyStateTextDescription={t(
          'When flows check their triggers for new data, each piece shows here with how often those checks succeed.',
        )}
        emptyStateIcon={<Zap />}
      />
    </Page>
  );
}

function toRow({
  pieceName,
  stats,
  days,
}: {
  pieceName: string;
  stats: TriggerStatusReport['pieces'][string];
  days: string[];
}): TriggerRow {
  const daily = days.map((day) => ({
    day,
    success: stats.dailyStats[day]?.success ?? 0,
    failure: stats.dailyStats[day]?.failure ?? 0,
  }));
  const last14Days = successRate(daily);
  return {
    id: pieceName,
    pieceName,
    runs: stats.totalRuns,
    status: statusOf(daily),
    days: [...daily].reverse().map(toDayBar),
    last24Hours: successRate(daily.slice(0, 1)),
    last7Days: successRate(daily.slice(0, 7)),
    last14Days,
  };
}

function statusOf(daily: DailyCount[]): TriggerStatus {
  const success = daily.reduce((sum, day) => sum + day.success, 0);
  const failure = daily.reduce((sum, day) => sum + day.failure, 0);
  if (failure === 0) {
    return 'healthy';
  }
  return success === 0 ? 'failing' : 'degraded';
}

function successRate(daily: DailyCount[]): number | null {
  const success = daily.reduce((sum, day) => sum + day.success, 0);
  const total = daily.reduce((sum, day) => sum + day.success + day.failure, 0);
  if (total === 0) {
    return null;
  }
  return Math.round((success / total) * 1000) / 10;
}

function toDayBar(day: DailyCount): DayBar {
  const total = day.success + day.failure;
  return {
    key: day.day,
    tone:
      total === 0
        ? 'empty'
        : day.failure === 0
        ? 'success'
        : day.success === 0
        ? 'danger'
        : 'warning',
    label: (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{listFormat.fullDate(day.day)}</span>
        <span>
          {total === 0
            ? t('No runs')
            : t('{success} succeeded, {failure} failed', {
                success: listFormat.count(day.success),
                failure: listFormat.count(day.failure),
              })}
        </span>
      </div>
    ),
  };
}

function lastDays(count: number): string[] {
  return Array.from({ length: count }, (_unused, index) =>
    dayjs().subtract(index, 'day').format('YYYY-MM-DD'),
  );
}

function RateCell({ value }: { value: number | null }) {
  return <NumberCell>{value === null ? undefined : `${value}%`}</NumberCell>;
}

function RightHeader({ label }: { label: string }) {
  return <span className="block text-right">{label}</span>;
}

const STATUS_DISPLAY: Record<
  TriggerStatus,
  { tone: 'success' | 'warning' | 'danger'; label: string }
> = {
  healthy: { tone: 'success', label: 'Healthy' },
  degraded: { tone: 'warning', label: 'Some failures' },
  failing: { tone: 'danger', label: 'Failing' },
};

const COLUMNS: ColumnDef<RowDataWithActions<TriggerRow>, unknown>[] = [
  {
    accessorKey: 'pieceName',
    header: () => t('Piece'),
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <PieceIconWithPieceName
          pieceName={row.original.pieceName}
          showTooltip={false}
          size="sm"
        />
        <span className="truncate font-medium text-gray-12">
          <PieceDisplayName pieceName={row.original.pieceName} />
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    size: 150,
    header: () => t('Status'),
    cell: ({ row }) => {
      const display = STATUS_DISPLAY[row.original.status];
      return <StatusDot tone={display.tone}>{t(display.label)}</StatusDot>;
    },
  },
  {
    accessorKey: 'runs',
    size: 100,
    header: () => <RightHeader label={t('Runs')} />,
    cell: ({ row }) => <NumberCell value={row.original.runs} />,
  },
  {
    accessorKey: 'days',
    size: 220,
    header: () => t('Last 14 days'),
    cell: ({ row }) => (
      <DayBars size="sm" days={row.original.days} className="w-48" />
    ),
  },
  {
    accessorKey: 'last24Hours',
    size: 80,
    header: () => <RightHeader label={t('24h')} />,
    cell: ({ row }) => <RateCell value={row.original.last24Hours} />,
  },
  {
    accessorKey: 'last7Days',
    size: 80,
    header: () => <RightHeader label={t('7d')} />,
    cell: ({ row }) => <RateCell value={row.original.last7Days} />,
  },
  {
    accessorKey: 'last14Days',
    size: 80,
    header: () => <RightHeader label={t('14d')} />,
    cell: ({ row }) => <RateCell value={row.original.last14Days} />,
  },
];

type DailyCount = { day: string; success: number; failure: number };

type TriggerStatus = 'healthy' | 'degraded' | 'failing';

type TriggerRow = {
  id: string;
  pieceName: string;
  runs: number;
  status: TriggerStatus;
  days: DayBar[];
  last24Hours: number | null;
  last7Days: number | null;
  last14Days: number | null;
};
