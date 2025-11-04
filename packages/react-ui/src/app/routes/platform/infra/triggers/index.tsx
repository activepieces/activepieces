import dayjs from 'dayjs';
import { t } from 'i18next';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { triggerRunHooks } from '@/features/flows/lib/trigger-run-api';
import PieceDisplayName from '@/features/pieces/components/piece-display-name';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';
import { TriggerStatusReport } from '@activepieces/shared';

import { StatusProgressBar, type DayStatus } from './status-progress-bar';

type TriggerHealthRow = {
  id: string;
  status: {
    type: string;
  };
  last24Hours: number;
  last7Days: number;
  last14Days: number;
  lastResults: DayStatus[];
  runs: number;
};

const STATUS = {
  SUCCESS: 'success',
  FAULT: 'fault',
  WARNING: 'warning',
};

const STATUS_TOOLTIPS: Record<string, string> = {
  [STATUS.SUCCESS]: 'All trigger runs were successful in the selected period.',
  [STATUS.WARNING]:
    'Some trigger runs failed. Please review for potential issues.',
  [STATUS.FAULT]: 'All trigger runs failed. Immediate attention required.',
};

const percentageForLastXDays = (
  days: number,
  pieceData: TriggerStatusReport['pieces'][string],
) => {
  const lastXDays = generateLastXDays(days);
  const successRuns = lastXDays.reduce(
    (acc, day) => acc + (pieceData.dailyStats[day]?.success ?? 0),
    0,
  );
  const failureRuns = lastXDays.reduce(
    (acc, day) => acc + (pieceData.dailyStats[day]?.failure ?? 0),
    0,
  );
  const percentage =
    successRuns > 0 ? (successRuns / (successRuns + failureRuns)) * 100 : 100;
  return Number(percentage.toFixed(1));
};

const generateLastXDays = (days: number): string[] => {
  return Array.from({ length: days }, (_, i) =>
    dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
  );
};

export default function TriggerHealthPage() {
  const { data: report, isLoading } = triggerRunHooks.useStatusReport();

  const triggerHealthData: TriggerHealthRow[] = isLoading
    ? []
    : Object.entries(report?.pieces ?? {}).map(([pieceName, pieceData]) => {
        const last7Days = percentageForLastXDays(7, pieceData);
        const last14Days = percentageForLastXDays(14, pieceData);
        const last24Hours = percentageForLastXDays(1, pieceData);
        return {
          id: pieceName,
          status: {
            type:
              last14Days === 100
                ? STATUS.SUCCESS
                : last14Days > 0
                ? STATUS.WARNING
                : STATUS.FAULT,
          },
          last24Hours,
          last7Days,
          last14Days,
          lastResults: generateLastXDays(14).map((day) => {
            const success = pieceData.dailyStats[day]?.success ?? 0;
            const failure = pieceData.dailyStats[day]?.failure ?? 0;
            const totalRuns = success + failure;
            return {
              date: day,
              success,
              failure,
              status:
                failure > 0 ? (success > 0 ? 'warning' : 'fault') : 'success',
              totalRuns: totalRuns,
            };
          }),
          runs: pieceData.totalRuns,
        };
      });

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case STATUS.SUCCESS:
        return <CheckCircle size={16} className="text-emerald-700" />;
      case STATUS.WARNING:
        return <AlertCircle size={16} className="text-yellow-700" />;
      case STATUS.FAULT:
        return <XCircle size={16} className="text-destructive" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case STATUS.SUCCESS:
        return 'text-emerald-700';
      case STATUS.WARNING:
        return 'text-yellow-700';
      case STATUS.FAULT:
        return 'text-destructive';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusTooltip = (statusType: string) => {
    return STATUS_TOOLTIPS[statusType] || 'Unknown status';
  };

  const columns = [
    {
      accessorKey: 'pieceDisplayName',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Piece" />
      ),
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            <PieceIconWithPieceName
              pieceName={row.original.id}
              showTooltip={false}
              size="md"
            />
            <div className="flex flex-col">
              <div className="font-medium flex items-center gap-2">
                <PieceDisplayName pieceName={row.original.id} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'flex items-center ml-2',
                        getStatusColor(status.type),
                      )}
                      tabIndex={0}
                      aria-label={getStatusTooltip(status.type)}
                      style={{ cursor: 'pointer' }}
                    >
                      {getStatusIcon(status.type)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getStatusTooltip(status.type)}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'runs',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Total Runs (14D)" />
      ),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.runs.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'lastResults',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Last Results" />
      ),
      cell: ({ row }: any) => (
        <StatusProgressBar days={row.original.lastResults} />
      ),
    },
    {
      accessorKey: 'last24Hours',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Last 24 Hours" />
      ),
      cell: ({ row }: any) => (
        <div className={cn('font-medium')}>{row.original.last24Hours}%</div>
      ),
    },
    {
      accessorKey: 'last7Days',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Last 7 Days" />
      ),
      cell: ({ row }: any) => (
        <div className={cn('font-medium')}>{row.original.last7Days}%</div>
      ),
    },
    {
      accessorKey: 'last14Days',
      header: ({ column }: any) => (
        <DataTableColumnHeader column={column} title="Last 14 Days" />
      ),
      cell: ({ row }: any) => (
        <div className={cn('font-medium')}>{row.original.last14Days}%</div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      <DashboardPageHeader
        title={t('Trigger Health Status')}
        description={t('Monitor the health and performance of your triggers')}
      />
      <DataTable
        emptyStateTextTitle={t('No trigger data available')}
        emptyStateTextDescription={t(
          'Trigger health information will appear here',
        )}
        emptyStateIcon={<CheckCircle className="size-14" />}
        hidePagination={true}
        columns={columns}
        page={{ data: triggerHealthData, previous: '', next: '' }}
        isLoading={isLoading}
      />
    </div>
  );
}
