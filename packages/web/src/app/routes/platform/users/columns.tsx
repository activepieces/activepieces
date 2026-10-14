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

import { StatusDot } from '@/app/components/admin';
import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { UserRowData } from './index';

type ColumnDefWithAccessorKey = ColumnDef<RowDataWithActions<UserRowData>> & {
  accessorKey: string;
};

export const createUsersTableColumns = (): ColumnDefWithAccessorKey[] => [
  {
    accessorKey: 'identity',
    size: 260,
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
        <div className="flex min-w-0 items-center gap-2">
          {isInvitation && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="size-4 shrink-0 text-gray-11" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Pending Invitation')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div
            className={cn(
              'flex min-w-0 flex-col gap-0.5',
              isInvitation && 'text-gray-11',
            )}
          >
            {showEmail && (
              <div className="flex min-w-0 items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-11" />
                <TextWithTooltip tooltipMessage={email}>
                  <div className="min-w-0 text-left">{email}</div>
                </TextWithTooltip>
              </div>
            )}
            {externalId && (
              <div className="flex min-w-0 items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 shrink-0 text-gray-11" />
                <TextWithTooltip tooltipMessage={externalId}>
                  <div className="min-w-0 text-left">{externalId}</div>
                </TextWithTooltip>
              </div>
            )}
            {!showEmail && !externalId && (
              <span className="text-gray-11">-</span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    size: 170,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} icon={Tag} />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-gray-11">-</div>;
      }
      const fullName =
        row.original.data.firstName + ' ' + row.original.data.lastName;
      return (
        <TextWithTooltip tooltipMessage={fullName}>
          <div className="min-w-0 text-left">{fullName}</div>
        </TextWithTooltip>
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
        return <div className="text-gray-11">-</div>;
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
        return <StatusDot tone="warning">{t('Pending')}</StatusDot>;
      }
      return row.original.data.status === UserStatus.ACTIVE ? (
        <StatusDot tone="success">{t('Activated')}</StatusDot>
      ) : (
        <StatusDot tone="neutral">{t('Deactivated')}</StatusDot>
      );
    },
  },
];
