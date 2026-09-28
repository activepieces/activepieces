import { PlatformRole, UserStatus } from '@activepieces/shared';
import {
  Clock01Icon,
  FingerPrintIcon,
  HashIcon,
  InformationCircleIcon,
  Mail01Icon,
  Pulse01Icon,
  Shield01Icon,
  Tag01Icon,
} from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
        icon={FingerPrintIcon}
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
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  className="h-4 w-4 text-warning-11"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('Pending Invitation')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <div
            className={`flex flex-col gap-0.5 ${
              isInvitation ? 'text-warning-11' : ''
            }`}
          >
            {showEmail && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="h-3.5 w-3.5 shrink-0 text-gray-11"
                />
                <TruncatedColumnTextValue
                  value={email}
                  className="max-w-[200px] 2xl:max-w-[280px]"
                />
              </div>
            )}
            {externalId && (
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={HashIcon}
                  className="h-3.5 w-3.5 shrink-0 text-gray-11"
                />
                <TruncatedColumnTextValue
                  value={externalId}
                  className="max-w-[200px] 2xl:max-w-[280px]"
                />
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
    size: 210,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Name')}
        icon={Tag01Icon}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-gray-11">-</div>;
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
      <DataTableColumnHeader
        column={column}
        title={t('Role')}
        icon={Shield01Icon}
      />
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
        icon={Clock01Icon}
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
        icon={Clock01Icon}
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
        icon={Pulse01Icon}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        return <div className="text-left text-warning-11">{t('Pending')}</div>;
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
