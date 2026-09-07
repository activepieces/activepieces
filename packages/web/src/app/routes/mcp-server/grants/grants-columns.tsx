import { McpOAuthGrant } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, FolderOpen, Plug, User } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        <DataTableColumnHeader
          column={column}
          title={t('Client')}
          icon={Plug}
        />
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
                <div className="truncate text-xs text-muted-foreground">
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
        <DataTableColumnHeader
          column={column}
          title={t('Project')}
          icon={FolderOpen}
        />
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
        <DataTableColumnHeader
          column={column}
          title={t('Member')}
          icon={User}
        />
      ),
      cell: ({ row }) => {
        const { member } = row.original;
        if (!member) {
          return <div className="text-muted-foreground">—</div>;
        }
        const name = `${member.firstName} ${member.lastName}`.trim();
        return (
          <TextWithTooltip tooltipMessage={member.email}>
            <div className="truncate text-muted-foreground">
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
        <DataTableColumnHeader
          column={column}
          title={t('Last used')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => {
        const lastUsed = grantUtils.formatLastUsed(row.original);
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                lastUsed.isActiveToday ? 'bg-success' : 'bg-transparent',
              )}
            />
            <span
              className={cn(!lastUsed.isActiveToday && 'text-muted-foreground')}
            >
              {lastUsed.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      size: 100,
      header: () => <span className="sr-only">{t('Revoke')}</span>,
      cell: ({ row }) => {
        const clientLabel = mcpClientDisplay.label({
          key: row.original.clientKey,
          clientName: row.original.clientName,
        });
        return (
          <div className="flex justify-end">
            <ConfirmationDeleteDialog
              title={t('Revoke access')}
              message={t(
                'Revoking {entityName}. Access ends within 15 minutes. The client will ask to sign in again.',
                { entityName: clientLabel },
              )}
              entityName={clientLabel}
              buttonText={t('Revoke')}
              isDanger
              showToast={false}
              mutationFn={() => onRevoke([row.original.id])}
            >
              <Button
                variant="link"
                className="h-auto p-0 text-destructive hover:text-destructive"
              >
                {t('Revoke')}
              </Button>
            </ConfirmationDeleteDialog>
          </div>
        );
      },
    },
  ];
}
