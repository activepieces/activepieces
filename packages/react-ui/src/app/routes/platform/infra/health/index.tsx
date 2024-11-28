import { CheckCircle, AlertTriangle, WifiOff, Frown } from 'lucide-react';
import React from 'react';
import semver from 'semver';

import { ApFlagId } from '@activepieces/shared';
import { useSocket } from '@/components/socket-provider';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { t } from 'i18next';


const STATUS = {
  UP_TO_DATE: 'up_to_date',
  UPDATE_AVAILABLE: 'update_available',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

export default function WorkersPage() {
  const { data: currentVersion } = flagsHooks.useFlag<string>(ApFlagId.CURRENT_VERSION);
  const { data: latestVersion } = flagsHooks.useFlag<string>(ApFlagId.LATEST_VERSION);

  const socket = useSocket();

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

  const healthData = [
    {
      id: 'version',
      check: 'Version Check',
      status: isVersionUpToDate ? STATUS.UP_TO_DATE : STATUS.UPDATE_AVAILABLE,
      details: `<b>Current</b>: ${currentVersion || 'Unknown'}\n<b>Latest</b>: ${latestVersion || 'Unknown'}\n${!isVersionUpToDate ? 'Upgrade now to enjoy the latest features and bug fixes.\nCheck the changelog <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://github.com/activepieces/activepieces/releases" target="_blank">releases</a>.' : ''}`,
    },
    {
      id: 'websocket',
      check: 'WebSocket Connection',
      status: socket.connected ? STATUS.CONNECTED : STATUS.DISCONNECTED,
      details: socket.connected
        ? 'Real-time communication is working'
        : 'Connection issues detected.<br>Visit the <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://www.activepieces.com/docs/install/configuration/troubleshooting" target="_blank">troubleshooting guide</a> for more details.',
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <TableTitle>{t('System Health Status')}</TableTitle>
      <DataTable
        hidePagination={true}
        columns={[
          {
            accessorKey: 'check',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Test" />
            ),
          },
          {
            accessorKey: 'status',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
              const status = row.original.status;
              return (
                <div
                  className={cn('flex gap-2 items-center', {
                    'text-success-300': [STATUS.UP_TO_DATE, STATUS.CONNECTED].includes(status),
                    'text-warning-300': status === STATUS.UPDATE_AVAILABLE,
                    'text-red-700': status === STATUS.DISCONNECTED,
                  })}
                >
                  {[STATUS.UP_TO_DATE, STATUS.CONNECTED].includes(status) && (
                    <CheckCircle size={16} />
                  )}
                  {status === STATUS.UPDATE_AVAILABLE && <Frown size={16} />}
                  {status === STATUS.DISCONNECTED && <WifiOff size={16} />}
                  <span>
                    {status === STATUS.UP_TO_DATE && 'Up to date'}
                    {status === STATUS.UPDATE_AVAILABLE && 'Update available'}
                    {status === STATUS.CONNECTED && 'Connected'}
                    {status === STATUS.DISCONNECTED && 'Disconnected'}
                  </span>
                </div>
              );
            },
          },
          {
            accessorKey: 'details',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Details" />
            ),
            cell: ({ row }) => (
              <div
                className="whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: row.original.details }}
              />
            ),
          },
        ]}
        page={{ data: healthData, previous: '', next: '' }}
        isLoading={false}
      />
    </div>
  );
}
