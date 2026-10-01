import {
  PlatformRole,
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DataTable } from '@/components/custom/data-table';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { EmptyMedia } from '@/components/ui/empty';
import { internalErrorToast } from '@/components/ui/sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSeatLimitGuard } from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';

import { UserActions } from './actions/user-actions';
import { createUsersTableColumns, PersonStatus, statusOf } from './columns';

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isOutOfSeats,
    ensureSeatsAvailable,
    handleSeatLimitError,
    seatLimitDialog,
  } = useSeatLimitGuard();

  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = platformUserHooks.useUsers();

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    isError: invitationsError,
    refetch: refetchInvitations,
  } = platformUserHooks.usePlatformInvitations();

  const refetch = () => {
    refetchUsers();
    refetchInvitations();
  };

  const search = searchParams.get('search') ?? '';
  const statusFilter = toStatusFilter(searchParams.get('status'));
  const roleFilterKey = searchParams.getAll('role').join(',');

  const combinedData: UserRowData[] = useMemo(() => {
    const users: UserRowData[] =
      usersData?.data?.map((user) => ({
        id: user.id,
        type: 'user' as const,
        data: user,
      })) ?? [];

    const pendingInvitations: UserRowData[] =
      invitationsData?.map((invitation) => ({
        id: invitation.id,
        type: 'invitation' as const,
        data: invitation,
      })) ?? [];

    return [...users, ...pendingInvitations];
  }, [usersData, invitationsData]);

  const counts = useMemo(
    () =>
      combinedData.reduce<Record<PersonStatus, number>>(
        (acc, row) => {
          const status = statusOf({ row });
          return { ...acc, [status]: acc[status] + 1 };
        },
        { active: 0, invited: 0, deactivated: 0 },
      ),
    [combinedData],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const roleFilter = roleFilterKey.length > 0 ? roleFilterKey.split(',') : [];
    return combinedData.filter((row) => {
      if (statusFilter !== 'all' && statusOf({ row }) !== statusFilter) {
        return false;
      }
      if (
        roleFilter.length > 0 &&
        !roleFilter.includes(row.data.platformRole ?? PlatformRole.MEMBER)
      ) {
        return false;
      }
      if (query.length === 0) {
        return true;
      }
      const name =
        row.type === 'user'
          ? `${row.data.firstName} ${row.data.lastName}`.toLowerCase()
          : '';
      return (
        name.includes(query) ||
        row.data.email.toLowerCase().includes(query) ||
        (row.type === 'user' &&
          (row.data.externalId ?? '').toLowerCase().includes(query))
      );
    });
  }, [combinedData, search, statusFilter, roleFilterKey]);

  const isLoading = usersLoading || invitationsLoading;
  const isError = usersError || invitationsError;

  const { mutate: deleteUser } = platformUserMutations.useDeleteUser({
    onSuccess: refetch,
  });

  const { mutate: deleteInvitation } =
    platformUserMutations.useDeleteInvitation({ onSuccess: refetch });

  const { mutate: updateUserStatus, isPending: isUpdatingStatus } =
    platformUserMutations.useUpdateUserStatus({
      onSuccess: refetch,
      onError: (error) => {
        if (!handleSeatLimitError(error)) {
          internalErrorToast();
        }
      },
    });

  const handleDelete = (id: string, isInvitation: boolean) => {
    if (isInvitation) {
      deleteInvitation(id);
    } else {
      deleteUser(id);
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: UserStatus) => {
    updateUserStatus({
      userId,
      status:
        currentStatus === UserStatus.ACTIVE
          ? UserStatus.INACTIVE
          : UserStatus.ACTIVE,
    });
  };

  const setParam = ({ key, value }: { key: string; value: string | null }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value.length === 0) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const openInvite = () => {
    if (ensureSeatsAvailable(1)) {
      setInviteOpen(true);
    }
  };

  const columns = createUsersTableColumns();
  const noMatches = rows.length === 0 && combinedData.length > 0;

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
        <Toolbar>
          <div className="min-w-64 flex-1">
            <SearchInput
              value={search}
              onChange={(value) => setParam({ key: 'search', value })}
              placeholder={t('Search by name, email or external ID')}
            />
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={(value) =>
              setParam({ key: 'status', value: value === 'all' ? null : value })
            }
          >
            <TabsList>
              <TabsTrigger value="all">
                {t('Everyone')}
                <span className="text-gray-11 tabular-nums">
                  {combinedData.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="active">
                {t('Active')}
                <span className="text-gray-11 tabular-nums">
                  {counts.active}
                </span>
              </TabsTrigger>
              <TabsTrigger value="invited">
                {t('Invited')}
                <span className="text-gray-11 tabular-nums">
                  {counts.invited}
                </span>
              </TabsTrigger>
              <TabsTrigger value="deactivated">
                {t('Deactivated')}
                <span className="text-gray-11 tabular-nums">
                  {counts.deactivated}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
        </Toolbar>
        <DataTable
          emptyStateTextTitle={
            noMatches ? t('Nobody matches') : t('Nobody here yet')
          }
          emptyStateTextDescription={
            noMatches
              ? t('Try a different name or clear a filter.')
              : t('Invite the people who will build and run flows.')
          }
          emptyStateIcon={
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
          }
          columns={columns}
          page={{
            data: rows,
            next: usersData?.next || null,
            previous: usersData?.previous || null,
          }}
          hidePagination={true}
          isLoading={isLoading}
          isError={isError}
          errorStateEntity={t('users')}
          onRetry={refetch}
          actions={[
            (row) => (
              <UserActions
                row={row}
                isUpdatingStatus={isUpdatingStatus}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onUpdate={refetch}
              />
            ),
          ]}
        />
      </Page>
      <InviteUserDialog
        open={inviteOpen}
        setOpen={setInviteOpen}
        onInviteSuccess={refetch}
      />
      {seatLimitDialog}
    </>
  );
}

function toStatusFilter(value: string | null): StatusFilter {
  if (value === 'active' || value === 'invited' || value === 'deactivated') {
    return value;
  }
  return 'all';
}

type StatusFilter = PersonStatus | 'all';

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
