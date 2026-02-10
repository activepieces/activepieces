import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Mail, Tag, Hash, Shield, Clock, Activity, Info } from 'lucide-react';

import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/ui/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlatformRole, UserStatus } from '@activepieces/shared';

import { UserRowData } from './index';

type ColumnDefWithAccessorKey = ColumnDef<RowDataWithActions<UserRowData>> & {
  accessorKey: string;
};

export const createUsersTableColumns = (): ColumnDefWithAccessorKey[] => [
  {
    accessorKey: 'email',
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Email')} icon={Mail} />
    ),
    cell: ({ row }) => {
      const email =
        row.original.type === 'user'
          ? row.original.data.email
          : row.original.data.email;
      const isInvitation = row.original.type === 'invitation';
      return (
        <div className="flex items-center gap-2">
          {isInvitation && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-orange-700" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Pending Invitation')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div className={isInvitation ? 'text-orange-700' : ''}>
            <TruncatedColumnTextValue value={email} />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} icon={Tag} />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-muted-foreground">-</div>;
      }
      return (
        <TruncatedColumnTextValue
          value={row.original.data.firstName + ' ' + row.original.data.lastName}
        />
      );
    },
  },
  {
    accessorKey: 'externalId',
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('External Id')}
        icon={Hash}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-muted-foreground">-</div>;
      }
      return <div className="text-left">{row.original.data.externalId}</div>;
    },
  },
  {
    accessorKey: 'role',
    size: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Role')} icon={Shield} />
    ),
    cell: ({ row }) => {
      const platformRole =
        row.original.type === 'user'
          ? row.original.data.platformRole
          : row.original.data.platformRole;

      return (
        <div className="text-left">
          {platformRole === PlatformRole.ADMIN
            ? t('Admin')
            : platformRole === PlatformRole.OPERATOR
            ? t('Operator')
            : t('Member')}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Created')}
        icon={Clock}
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <FormattedDate date={new Date(row.original.data.created)} />
        </div>
      );
    },
  },
  {
    accessorKey: 'lastActiveDate',
    size: 150,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Last Active')}
        icon={Clock}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-muted-foreground">-</div>;
      }
      return row.original.data.lastActiveDate ? (
        <div className="text-left">
          <FormattedDate date={new Date(row.original.data.lastActiveDate)} />
        </div>
      ) : (
        '-'
      );
    },
  },
  {
    accessorKey: 'status',
    size: 100,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Status')}
        icon={Activity}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-left text-orange-700">{t('Pending')}</div>;
      }
      return (
        <div className="text-left">
          {row.original.data.status === UserStatus.ACTIVE
            ? t('Activated')
            : t('Deactivated')}
        </div>
      );
    },
  },
];
