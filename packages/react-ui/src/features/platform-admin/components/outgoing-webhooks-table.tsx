import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { formatUtils } from '@/lib/utils';
import { OutgoingWebhook, OutgoingWebhookScope } from '@activepieces/ee-shared';
import { Project, SeekPage } from '@activepieces/shared';
import { outgoingWebhooksHooks } from '../lib/outgoing-webhooks-hooks';
import OutgoingWebhookActions from './outgoing-webhook-actions';

interface OutgoingWebhooksTableProps {
  webhooks: SeekPage<OutgoingWebhook> | undefined;
  isLoading: boolean;
  projects: Project[];
}

export const OutgoingWebhooksTable = ({
  webhooks,
  isLoading,
  projects,
}: OutgoingWebhooksTableProps) => {

  const columns: ColumnDef<RowDataWithActions<OutgoingWebhook>>[] = [
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
      accessorKey: 'scope',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Scope')} />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.scope === OutgoingWebhookScope.PLATFORM ? 'default' : 'outline'}>
          {row.original.scope}
        </Badge>
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
      cell: ({ row }) => (
        <OutgoingWebhookActions webhook={row.original} projects={projects} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      page={webhooks}
      isLoading={isLoading}
      emptyStateTextTitle={t('No webhooks found')}
      emptyStateTextDescription={t('Create your first webhook to get started')}
      emptyStateIcon={<Globe />}
    />
  );
};
