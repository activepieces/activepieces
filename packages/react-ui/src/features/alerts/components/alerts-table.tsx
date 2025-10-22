import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { Alert, AlertChannel } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';
import AlertActions from './alert-actions';

interface AlertsTableProps {
  alerts: SeekPage<Alert> | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const AlertsTable = ({
  alerts,
  isLoading,
  isError,
}: AlertsTableProps) => {
  const columns: ColumnDef<RowDataWithActions<Alert>>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'receivers',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Receivers')} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {row.original.receivers.slice(0, 2).map((receiver) => (
            <Badge key={receiver} variant="outline" className="text-xs">
              {receiver}
            </Badge>
          ))}
          {row.original.receivers.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.receivers.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'events',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Events')} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {row.original.events.slice(0, 2).map((event) => (
            <Badge key={event} variant="outline" className="text-xs">
              {event.replace(/_/g, ' ')}
            </Badge>
          ))}
          {row.original.events.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.events.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'channel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Channel')} />
      ),
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.channel === AlertChannel.EMAIL
              ? 'default'
              : 'outline'
          }
        >
          {row.original.channel}
        </Badge>
      ),
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <AlertActions alert={row.original} />
      ),
    },
  ];

  if (isError) {
    return <div>{t('Error loading alerts')}</div>;
  }

  return (
    <DataTable
      columns={columns}
      page={alerts}
      isLoading={isLoading}
      emptyStateTextTitle={t('No alerts found')}
      emptyStateTextDescription={t('Create your first alert to get started')}
      emptyStateIcon={<Bell />}
      
    />
  );
};
