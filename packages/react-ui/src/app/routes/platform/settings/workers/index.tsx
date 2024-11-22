import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Network, Server, ServerOff } from 'lucide-react';

import { WorkerConfigsModal } from '@/app/components/worker-configs-dialog';
import { CircularIcon } from '@/components/custom/circular-icon';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { workersApi } from '@/features/platform-admin-panel/lib/workers-api';
import { formatUtils } from '@/lib/utils';

export default function WorkersPage() {
  const { data: workersData, isLoading } = useQuery({
    queryKey: ['worker-machines'],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      return workersApi.list();
    },
  });

  return (
    <div className="flex flex-col w-full">
      <TableTitle>{t('Workers')}</TableTitle>
      <DataTable
        hidePagination={true}
        columns={[
          {
            accessorKey: 'information.ip',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('IP Address')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex items-center">
                  <Network size={16} className="text-muted-foreground" />
                  <span className="ms-2">{row.original.information.ip}</span>
                </div>
              );
            },
          },
          {
            accessorKey: 'status',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Status')} />
            ),
            cell: ({ row }) => {
              const status = row.original.status;
              return (
                <div className="flex gap-1 items-center p-2 capitalize">
                  {status === 'ONLINE' ? (
                    <Server size={14} className="text-green-500" />
                  ) : (
                    <ServerOff className="text-red-500" />
                  )}
                  {t(status.toLowerCase())}
                </div>
              );
            },
          },
          {
            accessorKey: 'information.cpuUsagePercentage',

            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('CPU Usage')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex items-center">
                  <CircularIcon
                    value={row.original.information.cpuUsagePercentage}
                  />
                </div>
              );
            },
          },

          {
            accessorKey: 'information.diskInfo.percentage',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Disk Usage')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex items-center">
                  <CircularIcon
                    value={row.original.information.diskInfo.percentage}
                  />
                </div>
              );
            },
          },
          {
            accessorKey: 'information.ramUsagePercentage',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('RAM Usage')} />
            ),
            cell: ({ row }) => {
              const ramUsage = row.original.information.ramUsagePercentage;
              const totalRam =
                row.original.information.totalAvailableRamInBytes;
              const usedRam = (totalRam * (ramUsage / 100)) / 1024 ** 3;
              const formattedUsedRam = `${usedRam.toFixed(1)} GB`;
              const formattedTotalRam = `${(totalRam / 1024 ** 3).toFixed(
                1
              )} GB`;

              return (
                <div className="flex items-center">
                  {formattedUsedRam} / {formattedTotalRam}
                </div>
              );
            },
          },
          {
            accessorKey: 'updated',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('Last Contact')}
              />
            ),
            cell: ({ row }) => {
              return (
                <div className="text-start">
                  {formatUtils.formatDateOnly(new Date(row.original.updated))}
                </div>
              );
            },
          },
        ]}
        actions={[(row) => <WorkerConfigsModal worker={row} />]}
        page={{ data: workersData ?? [], previous: '', next: '' }}
        isLoading={isLoading}
      />
    </div>
  );
}
