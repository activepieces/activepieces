import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { EventDestination } from '@activepieces/ee-shared';

import EventDestinationActions from './event-destination-actions';

interface EventDestinationsTableProps {
  destinations: EventDestination[];
}

export const EventDestinationsTable = ({
  destinations,
}: EventDestinationsTableProps) => {
  const columns: ColumnDef<RowDataWithActions<EventDestination>>[] = [
    {
      accessorKey: 'url',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('URL')} />
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-mono text-sm">
          {row.original.url}
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
      cell: ({ row }) => <EventDestinationActions destination={row.original} />,
    },
  ];

  const page = {
    data: destinations,
    next: null,
    previous: null,
  };

  return (
    <DataTable
      columns={columns}
      page={page}
      clientPagination={true}
      isLoading={false}
      emptyStateTextTitle={t('No destinations found')}
      emptyStateTextDescription={t(
        'Create your first destination to get started',
      )}
      emptyStateIcon={<Globe />}
    />
  );
};
