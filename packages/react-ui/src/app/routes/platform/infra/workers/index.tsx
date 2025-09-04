import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { InfoIcon, Network, Server, ServerOff } from 'lucide-react';

import { CircularIcon } from '@/components/custom/circular-icon';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { workersApi } from '@/features/platform-admin/lib/workers-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, useTimeAgo } from '@/lib/utils';
import {
  ApEdition,
  ApFlagId,
  WorkerMachineStatus,
  WorkerMachineWithStatus,
} from '@activepieces/shared';

import { WorkerConfigsModal } from './worker-configs-dialog';

const DEMO_WORKERS_DATA: WorkerMachineWithStatus[] = [
  {
    id: 'hbAcAzqbOEQLzvIi6PMCF',
    created: '2024-11-23T18:51:30.000Z',
    updated: dayjs().subtract(10, 'seconds').toISOString(),
    information: {
      workerId: 'hbAcAzqbOEQLzvIi6PMCF',
      diskInfo: {
        total: 337374281728,
        free: 220669583360,
        used: 116704698368,
        percentage: 34.59205537845069,
      },
      workerProps: {
        WORKER_CONCURRENCY: '8',
      },
      cpuUsagePercentage: 2.335817759768149,
      ramUsagePercentage: 52.699635773121855,
      totalAvailableRamInBytes: 33364979712,
      ip: '172.16.254.1',
      totalSandboxes: 8,
      freeSandboxes: 8,
    },
    status: WorkerMachineStatus.ONLINE,
  },
  {
    id: 'kpMnBxRtYuWvZsQi9NLCJ',
    created: '2024-11-23T19:12:45.000Z',
    updated: dayjs().subtract(1, 'minute').toISOString(),
    information: {
      workerId: 'kpMnBxRtYuWvZsQi9NLCJ',
      diskInfo: {
        total: 536870912000,
        free: 322122547200,
        used: 214748364800,
        percentage: 40.0,
      },
      workerProps: {
        WORKER_CONCURRENCY: '8',
      },
      cpuUsagePercentage: 5.6,
      ramUsagePercentage: 45.2,
      totalAvailableRamInBytes: 42949672960,
      ip: '192.168.1.100',
      totalSandboxes: 8,
      freeSandboxes: 8,
    },
    status: WorkerMachineStatus.ONLINE,
  },
];

export default function WorkersPage() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showDemoData = edition === ApEdition.CLOUD;
  const { data: workersData, isLoading } = useQuery<WorkerMachineWithStatus[]>({
    queryKey: ['worker-machines'],
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
    queryFn: async () =>
      showDemoData ? DEMO_WORKERS_DATA : await workersApi.list(),
  });

  return (
    <div className="flex flex-col w-full gap-4">
      <DashboardPageHeader
        description={t('Check the health of your worker machines')}
        title={t('Workers Machine')}
      />
      {showDemoData && (
        <Alert variant="default">
          <div className="flex items-center gap-2">
            <InfoIcon size={16} />
            <AlertDescription>
              {t(
                'This is demo data. In a real environment, this would show your actual worker machines.',
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}
      <DataTable
        emptyStateTextTitle={t('No workers found')}
        emptyStateTextDescription={t(
          "You don't have any worker machines yet. Spin up new machines to execute your automations",
        )}
        emptyStateIcon={<Server className="size-14" />}
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
                <div
                  className={cn('flex gap-1 items-center p-2 capitalize', {
                    'text-success-300': status === WorkerMachineStatus.ONLINE,
                    'text-danger-300': status === WorkerMachineStatus.OFFLINE,
                  })}
                >
                  {status === WorkerMachineStatus.ONLINE ? (
                    <Server size={14} />
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
              const diskInfo = row.original.information.diskInfo;
              const totalDisk = diskInfo.total;
              const freeDisk = diskInfo.free;
              const usedDisk = totalDisk - freeDisk;
              const formattedUsedDisk = `${(usedDisk / 1024 ** 3).toFixed(
                1,
              )} GB`;
              const formattedTotalDisk = `${(totalDisk / 1024 ** 3).toFixed(
                1,
              )} GB`;

              return (
                <div className="flex items-center text-sm">
                  {formattedUsedDisk} / {formattedTotalDisk}
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
                1,
              )} GB`;

              return (
                <div className="flex items-center">
                  {formattedUsedRam} / {formattedTotalRam}
                </div>
              );
            },
          },
          {
            accessorKey: 'information.sandboxes',
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title={t('Sandboxes Free')}
              />
            ),
            cell: ({ row }) => {
              const freeSandboxes = row.original.information.freeSandboxes ?? 0;
              const totalSandboxes =
                row.original.information.totalSandboxes ?? 0;
              return (
                <div className="flex items-center">
                  <span>
                    {freeSandboxes} / {totalSandboxes}
                  </span>
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
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const timeAgo = useTimeAgo(new Date(row.original.updated));
              return <div className="text-start">{timeAgo}</div>;
            },
          },
          {
            accessorKey: 'version',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title={t('Version')} />
            ),
            cell: ({ row }) => {
              return (
                <div className="text-start">
                  {row.original.information.workerProps.version ?? ' <= 0.39.4'}
                </div>
              );
            },
          },
        ]}
        actions={[
          (row) => (
            <WorkerConfigsModal workerProps={row.information.workerProps} />
          ),
        ]}
        page={{ data: workersData ?? [], previous: '', next: '' }}
        isLoading={isLoading}
      />
    </div>
  );
}
