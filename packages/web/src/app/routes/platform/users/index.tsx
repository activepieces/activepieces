import { PlatformRole, UserStatus } from '@activepieces/shared';
import { t } from 'i18next';
import {
  CircleMinus,
  Crown,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable } from '@/components/custom/data-table';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenuItem } from '@/components/custom/list/row-menu';
import { useUrlParam } from '@/components/custom/list/use-url-param';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { useSeatLimitGuard } from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';

import {
  createUsersTableColumns,
  PersonStatus,
  personName,
  statusOf,
  UserRowData,
} from './columns';
import { UserSheet } from './user-sheet';

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<UserRowData | null>(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const roleFilter = searchParams.getAll('role');
  const [statusFilter, setStatusFilter] = useUrlParam<StatusFilter>({
    key: 'status',
    fallback: 'all',
    allowed: STATUS_FILTERS,
  });
  const {
    isOutOfSeats,
    ensureSeatsAvailable,
    handleSeatLimitError,
    seatLimitDialog,
  } = useSeatLimitGuard();

  const users = platformUserHooks.useUsers();
  const invitations = platformUserHooks.usePlatformInvitations();
  const refetch = () => {
    users.refetch();
    invitations.refetch();
  };

  const allRows: UserRowData[] = useMemo(
    () => [
      ...(users.data?.data ?? []).map(
        (user): UserRowData => ({ id: user.id, type: 'user', data: user }),
      ),
      ...(invitations.data ?? []).map(
        (invitation): UserRowData => ({
          id: invitation.id,
          type: 'invitation',
          data: invitation,
        }),
      ),
    ],
    [users.data, invitations.data],
  );

  const counts = useMemo(
    () =>
      allRows.reduce<Record<PersonStatus, number>>(
        (acc, row) => {
          const status = statusOf({ row });
          return { ...acc, [status]: acc[status] + 1 };
        },
        { active: 0, invited: 0, deactivated: 0 },
      ),
    [allRows],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter(
      (row) =>
        (statusFilter === 'all' || statusOf({ row }) === statusFilter) &&
        (roleFilter.length === 0 ||
          roleFilter.includes(row.data.platformRole ?? PlatformRole.MEMBER)) &&
        (query.length === 0 ||
          (personName({ row }) ?? '').toLowerCase().includes(query) ||
          row.data.email.toLowerCase().includes(query)),
    );
  }, [allRows, search, statusFilter, roleFilter]);

  const openRow = allRows.find((row) => row.id === openId) ?? null;

  const { mutate: updateStatus } = platformUserMutations.useUpdateUserStatus({
    onSuccess: refetch,
    onError: (error) => {
      if (!handleSeatLimitError(error)) {
        internalErrorToast();
      }
    },
  });
  const { mutateAsync: deleteUser } = platformUserMutations.useDeleteUser({
    onSuccess: refetch,
  });
  const { mutateAsync: deleteInvitation } =
    platformUserMutations.useDeleteInvitation({ onSuccess: refetch });

  const openInvite = () => {
    if (ensureSeatsAvailable(1)) {
      setInviteOpen(true);
    }
  };

  const menuItems = (row: UserRowData): RowMenuItem[] => {
    if (row.type === 'invitation') {
      return [
        {
          label: t('Revoke invitation'),
          icon: Trash2,
          destructive: true,
          onSelect: () => setDeleting(row),
        },
      ];
    }
    const isActive = row.data.status === UserStatus.ACTIVE;
    const isAdmin = row.data.platformRole === PlatformRole.ADMIN;
    return [
      { label: t('Edit'), icon: Pencil, onSelect: () => setOpenId(row.id) },
      {
        label: isActive ? t('Deactivate') : t('Activate'),
        icon: isActive ? CircleMinus : RotateCcw,
        disabled: isAdmin,
        disabledReason: t('Admins stay active. Change the role first.'),
        onSelect: () =>
          updateStatus({
            userId: row.data.id,
            status: isActive ? UserStatus.INACTIVE : UserStatus.ACTIVE,
          }),
      },
      {
        label: t('Delete'),
        icon: Trash2,
        destructive: true,
        onSelect: () => setDeleting(row),
      },
    ];
  };

  const columns = createUsersTableColumns({ menuItems });
  const filtered =
    search.trim().length > 0 || statusFilter !== 'all' || roleFilter.length > 0;

  return (
    <>
      <Page>
        <PageHeader
          title={t('Users')}
          description={t(
            'Everyone with an account on the platform, and everyone invited to make one.',
          )}
        >
          <Button onClick={openInvite}>
            {isOutOfSeats ? <Crown /> : <UserPlus />}
            {t('Invite people')}
          </Button>
        </PageHeader>
        <AdminTabs section="users" />
        <ListToolbar
          search={<ListSearch placeholder={t('Search name or email')} />}
          tabs={
            <CountTabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: t('Everyone'), count: allRows.length },
                { value: 'active', label: t('Active'), count: counts.active },
                {
                  value: 'invited',
                  label: t('Invited'),
                  count: counts.invited,
                },
                {
                  value: 'deactivated',
                  label: t('Deactivated'),
                  count: counts.deactivated,
                },
              ]}
            />
          }
          filters={
            <DataTableFilter
              type="select"
              title={t('Role')}
              accessorKey="role"
              options={[
                { label: t('Admin'), value: PlatformRole.ADMIN },
                { label: t('Operator'), value: PlatformRole.OPERATOR },
                { label: t('Member'), value: PlatformRole.MEMBER },
              ]}
            />
          }
        />
        <DataTable
          emptyStateTextTitle={
            filtered ? t('Nobody matches') : t('Nobody here yet')
          }
          emptyStateTextDescription={
            filtered
              ? t('Try a different name or clear a filter.')
              : t('Invite the people who will build and run flows.')
          }
          emptyStateIcon={<Users />}
          emptyStateAction={
            filtered ? undefined : (
              <Button onClick={openInvite}>
                <UserPlus />
                {t('Invite people')}
              </Button>
            )
          }
          columns={columns}
          page={{ data: rows, next: null, previous: null }}
          clientPagination
          hidePagination={rows.length <= PAGE_SIZE}
          onRowClick={(row) => setOpenId(row.id)}
          isLoading={users.isLoading || invitations.isLoading}
          isError={users.isError || invitations.isError}
          errorStateEntity={t('users')}
          onRetry={refetch}
        />
      </Page>
      <UserSheet
        row={openRow}
        onOpenChange={(open) => !open && setOpenId(null)}
        onSaved={refetch}
        onDelete={setDeleting}
        onSeatLimitError={handleSeatLimitError}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={
            deleting.type === 'invitation'
              ? t('Revoke the invitation for {email}?', {
                  email: deleting.data.email,
                })
              : t('Delete {name}?', {
                  name: personName({ row: deleting }) ?? deleting.data.email,
                })
          }
          description={
            deleting.type === 'invitation'
              ? t('The link in their email stops working.')
              : t('Their account is removed from the platform for good.')
          }
          confirmLabel={
            deleting.type === 'invitation' ? t('Revoke') : t('Delete')
          }
          typeToConfirm={
            deleting.type === 'invitation' ? undefined : deleting.data.email
          }
          onConfirm={async () => {
            if (deleting.type === 'invitation') {
              await deleteInvitation(deleting.id);
            } else {
              await deleteUser(deleting.data.id);
            }
            setOpenId(null);
          }}
        />
      )}
      <InviteUserDialog
        open={inviteOpen}
        setOpen={setInviteOpen}
        onInviteSuccess={refetch}
      />
      {seatLimitDialog}
    </>
  );
}

const PAGE_SIZE = 10;
const STATUS_FILTERS = ['all', 'active', 'invited', 'deactivated'] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
