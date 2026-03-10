import { PlatformRole, UserStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Tag,
  Fingerprint,
  Shield,
  Clock,
  Activity,
  Info,
  Mail,
  Hash,
} from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from './index';

type ColumnDefWithAccessorKey = ColumnDef<RowDataWithActions<UserRowData>> & {
  accessorKey: string;
};

export const createUsersTableColumns = (): ColumnDefWithAccessorKey[] => [
  {
    accessorKey: 'identity',
    size: 320,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Identity')}
        icon={Fingerprint}
      />
    ),
    cell: ({ row }) => {
      const isInvitation = row.original.type === 'invitation';
      const externalId =
        row.original.type === 'user' ? row.original.data.externalId : undefined;
      const email = row.original.data.email;
      const showEmail = email?.includes('@');

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
          <div
            className={`flex flex-col gap-0.5 ${
              isInvitation ? 'text-orange-700' : ''
            }`}
          >
            {showEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <TruncatedColumnTextValue
                  value={email}
                  className="max-w-[200px] 2xl:max-w-[280px]"
                />
              </div>
            )}
            {externalId && (
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <TruncatedColumnTextValue
                  value={externalId}
                  className="max-w-[200px] 2xl:max-w-[280px]"
                />
              </div>
            )}
            {!showEmail && !externalId && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    size: 210,
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
          className="max-w-[160px] 2xl:max-w-[200px]"
        />
      );
    },
  },
  {
    accessorKey: 'role',
    size: 90,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Role')} icon={Shield} />
    ),
    cell: ({ row }) => {
      const platformRole = row.original.data.platformRole;
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
    size: 130,
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
    size: 130,
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
