import { McpOAuthGrant } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { MoreHorizontal, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ClientIcon } from '../client-icon';
import { mcpClientDisplay } from '../mcp-client-display';

import { grantUtils } from './grant-utils';

export function buildGrantsColumns({
  currentUserId,
  onRevoke,
}: {
  currentUserId: string | undefined;
  onRevoke: (ids: string[]) => Promise<void>;
}): ColumnDef<RowDataWithActions<McpOAuthGrant>, unknown>[] {
  return [
    {
      accessorKey: 'client',
      size: 260,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Client')} />
      ),
      cell: ({ row }) => {
        const label = mcpClientDisplay.label({
          key: row.original.clientKey,
          clientName: row.original.clientName,
        });
        return (
          <div className="flex min-w-0 items-center gap-3">
            <ClientIcon
              icon={mcpClientDisplay.icon(row.original.clientKey)}
              className="size-7"
            />
            <div className="min-w-0">
              <TextWithTooltip tooltipMessage={label}>
                <div className="truncate font-medium">{label}</div>
              </TextWithTooltip>
              {row.original.clientKey === 'unknown' && (
                <div className="truncate text-xs text-gray-11">
                  {t('Same access as any other')}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'project',
      size: 180,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {row.original.projectName ?? t('All projects')}
        </Badge>
      ),
    },
    {
      accessorKey: 'member',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Member')} />
      ),
      cell: ({ row }) => {
        const { member } = row.original;
        if (!member) {
          return <div className="text-gray-11">—</div>;
        }
        const name = `${member.firstName} ${member.lastName}`.trim();
        return (
          <TextWithTooltip tooltipMessage={member.email}>
            <div className="truncate text-gray-11">
              {member.id === currentUserId ? t('{name} · you', { name }) : name}
            </div>
          </TextWithTooltip>
        );
      },
    },
    {
      accessorKey: 'lastUsedAt',
      size: 160,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last used')} />
      ),
      cell: ({ row }) => {
        const lastUsed = grantUtils.formatLastUsed(row.original);
        if (lastUsed.isActiveToday) {
          return <StatusDot tone="success">{lastUsed.label}</StatusDot>;
        }
        return <span className="text-gray-11">{lastUsed.label}</span>;
      },
    },
    {
      accessorKey: 'actions',
      size: 56,
      header: () => <span className="sr-only">{t('Actions')}</span>,
      cell: ({ row }) => {
        const clientLabel = mcpClientDisplay.label({
          key: row.original.clientKey,
          clientName: row.original.clientName,
        });
        return (
          <div className="flex justify-end">
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('More actions')}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ConfirmDialog
                  title={t('Revoke {name}?', { name: clientLabel })}
                  description={t(
                    'Revoking {entityName}. Access ends immediately. The client will ask to sign in again.',
                    { entityName: clientLabel },
                  )}
                  confirmLabel={t('Revoke')}
                  onConfirm={() => onRevoke([row.original.id])}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash2 />
                    {t('Revoke')}
                  </DropdownMenuItem>
                </ConfirmDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
