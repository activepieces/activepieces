import {
  PlatformRole,
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  DateCell,
  MutedCell,
  PersonCell,
} from '@/components/custom/list/list-cells';
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';
import { StatusDot } from '@/components/custom/status-dot';

export const createUsersTableColumns = ({
  menuItems,
}: {
  menuItems: (row: UserRowData) => RowMenuItem[];
}): ColumnDef<RowDataWithActions<UserRowData>>[] => [
  {
    id: 'person',
    size: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Person')} />
    ),
    cell: ({ row }) => (
      <PersonCell
        name={personName({ row: row.original })}
        email={row.original.data.email}
      />
    ),
  },
  {
    id: 'role',
    size: 128,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Role')} />
    ),
    cell: ({ row }) => (
      <MutedCell>{platformRoleLabel(row.original.data.platformRole)}</MutedCell>
    ),
  },
  {
    id: 'status',
    size: 136,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => (
      <PersonStatusDot status={statusOf({ row: row.original })} />
    ),
  },
  {
    id: 'lastActive',
    size: 148,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last active')} />
    ),
    cell: ({ row }) =>
      row.original.type === 'invitation' ? (
        <MutedCell>{null}</MutedCell>
      ) : (
        <DateCell value={row.original.data.lastActiveDate} />
      ),
  },
  {
    id: 'joined',
    size: 112,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Joined')} />
    ),
    cell: ({ row }) =>
      row.original.type === 'invitation' ? (
        <MutedCell>{null}</MutedCell>
      ) : (
        <DateCell value={row.original.data.created} mode="short" />
      ),
  },
  {
    id: 'actions',
    size: 56,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowMenu items={menuItems(row.original)} />
      </div>
    ),
  },
];

export function PersonStatusDot({ status }: { status: PersonStatus }) {
  return (
    <StatusDot tone={STATUS_TONE[status]}>{statusLabel(status)}</StatusDot>
  );
}

export function statusOf({ row }: { row: UserRowData }): PersonStatus {
  if (row.type === 'invitation') {
    return 'invited';
  }
  return row.data.status === UserStatus.ACTIVE ? 'active' : 'deactivated';
}

export function personName({ row }: { row: UserRowData }): string | null {
  if (row.type === 'invitation') {
    return null;
  }
  const name = `${row.data.firstName} ${row.data.lastName}`.trim();
  return name.length > 0 ? name : null;
}

export function platformRoleLabel(
  role: PlatformRole | null | undefined,
): string {
  switch (role) {
    case PlatformRole.ADMIN:
      return t('Admin');
    case PlatformRole.OPERATOR:
      return t('Operator');
    default:
      return t('Member');
  }
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

export type UserRowData =
  | {
      id: string;
      type: 'user';
      data: UserWithMetaInformation;
    }
  | {
      id: string;
      type: 'invitation';
      data: UserInvitation;
    };
