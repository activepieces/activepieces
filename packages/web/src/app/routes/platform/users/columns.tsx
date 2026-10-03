import { PlatformRole, UserStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { UserPlus } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  InitialsTile,
  MutedCell,
  NameCell,
} from '@/components/custom/list/list-cells';
import { listFormat } from '@/components/custom/list/list-format';

import { UserRowData } from './index';

export const createUsersTableColumns = (): ColumnDef<
  RowDataWithActions<UserRowData>
>[] => [
  {
    accessorKey: 'identity',
    size: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Person')} />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return (
          <NameCell
            media={
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-7 text-gray-11">
                <UserPlus className="size-3.5" />
              </span>
            }
            title={row.original.data.email}
            sub={t('Invitation pending')}
          />
        );
      }
      const user = row.original.data;
      const name = `${user.firstName} ${user.lastName}`.trim();
      const isInactive = user.status === UserStatus.INACTIVE;
      return (
        <NameCell
          media={
            <InitialsTile
              name={name || user.email}
              className={cn(isInactive && 'opacity-50')}
            />
          }
          title={name || user.email}
          sub={[name ? user.email : undefined, user.externalId]
            .filter((part) => part && part.length > 0)
            .join(' · ')}
        />
      );
    },
  },
  {
    accessorKey: 'role',
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Role')} />
    ),
    cell: ({ row }) => {
      switch (row.original.data.platformRole) {
        case PlatformRole.ADMIN:
          return <Badge variant="secondary">{t('Admin')}</Badge>;
        case PlatformRole.OPERATOR:
          return <Badge variant="outline">{t('Operator')}</Badge>;
        default:
          return <MutedCell>{t('Member')}</MutedCell>;
      }
    },
  },
  {
    accessorKey: 'status',
    size: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      const status = statusOf({ row: row.original });
      return (
        <StatusDot tone={STATUS_TONE[status]}>{statusLabel(status)}</StatusDot>
      );
    },
  },
  {
    accessorKey: 'lastActiveDate',
    size: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last active')} />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <MutedCell>—</MutedCell>;
      }
      return (
        <MutedCell>
          {listFormat.relativeDate(row.original.data.lastActiveDate)}
        </MutedCell>
      );
    },
  },
  {
    accessorKey: 'created',
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => (
      <MutedCell>{listFormat.shortDate(row.original.data.created)}</MutedCell>
    ),
  },
];

export function statusOf({ row }: { row: UserRowData }): PersonStatus {
  if (row.type === 'invitation') {
    return 'invited';
  }
  return row.data.status === UserStatus.ACTIVE ? 'active' : 'deactivated';
}

function statusLabel(status: PersonStatus): string {
  switch (status) {
    case 'active':
      return t('Active');
    case 'invited':
      return t('Invited');
    case 'deactivated':
      return t('Deactivated');
  }
}

const STATUS_TONE: Record<PersonStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  invited: 'warning',
  deactivated: 'neutral',
};

export type PersonStatus = 'active' | 'invited' | 'deactivated';
