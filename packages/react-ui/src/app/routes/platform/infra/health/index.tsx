import { CheckCircle, WifiOff, Frown } from 'lucide-react';
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
  SUCCESS: 'success',
  FAULT: 'fault'
};

const MESSAGE_CLASSES = {
  SUCCESS: 'text-success-300',
  WARNING: 'text-warning-300',
  DESTRUCTIVE: 'text-destructive-300'
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
      status: {
        type: isVersionUpToDate ? STATUS.SUCCESS : STATUS.FAULT,
        message: isVersionUpToDate ? 'Up to date' : 'Update available'
      },
      details: `<b>Current</b>: ${currentVersion || 'Unknown'}\n<b>Latest</b>: ${latestVersion || 'Unknown'}\n${!isVersionUpToDate ? 'Upgrade now to enjoy the latest features and bug fixes.\nCheck the changelog <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://github.com/activepieces/activepieces/releases" target="_blank">releases</a>.' : ''}`,
      containerClassName: isVersionUpToDate ? MESSAGE_CLASSES.SUCCESS : MESSAGE_CLASSES.WARNING,
      faultIcon: <Frown size={16} />
    },
    {
      id: 'websocket',
      check: t('WebSocket Connection'),
      status: {
        type: socket.connected ? STATUS.SUCCESS : STATUS.FAULT,
        message: socket.connected ? t('Connected') : t('Disconnected')
      },
      details: socket.connected
        ? t('Real-time communication is working')
        : 'Connection issues detected.<br>Visit the <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://www.activepieces.com/docs/install/configuration/troubleshooting" target="_blank">troubleshooting guide</a> for more details.',
      containerClassName: isVersionUpToDate ? MESSAGE_CLASSES.SUCCESS : MESSAGE_CLASSES.DESTRUCTIVE,
      faultIcon: <WifiOff size={16} />
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
                  className={cn('flex gap-2 items-center', row.original.containerClassName)}
                >
                  {status.type === STATUS.SUCCESS ? (
                    <CheckCircle size={16} />
                  ) : (
                      row.original.faultIcon
                  )}
         
                  <span>
                    {status.message}
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
