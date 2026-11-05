import {
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { dataTableFilterUtils } from '@/components/custom/data-table/data-table-filter-utils';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { useSeatLimitGuard } from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { UserActions } from './actions/user-actions';
import {
  createUsersTableColumns,
  getUserRowStatus,
  INVITED_USER_STATUS,
  UserRowStatus,
} from './columns';

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

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isOutOfSeats, handleSeatLimitError, seatLimitDialog } =
    useSeatLimitGuard();

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

  const [searchParams] = useSearchParams();
  const selectedStatuses = dataTableFilterUtils.getSelectedValues({
    searchParams,
    key: STATUS_FILTER_KEY,
    allowedValues: STATUS_FILTER_VALUES,
    defaultValues: DEFAULT_STATUS_FILTER,
  });
  const visibleRows =
    selectedStatuses.length === 0
      ? combinedData
      : combinedData.filter((row) =>
          selectedStatuses.includes(getUserRowStatus(row)),
        );
  const hiddenUsersCount = combinedData.length - visibleRows.length;

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

  const columns = createUsersTableColumns();

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Users')}
        description={t(
          'Manage, delete, activate and deactivate users on platform',
        )}
        resources={adminPageResources.users}
      >
        <Button
          {...adminControl(AdminControl.USERS_INVITE_OPEN)}
          onClick={() => setInviteOpen(true)}
        >
          {isOutOfSeats ? (
            <Gem className="text-on-accent/90" />
          ) : (
            <UserRoundPlusIcon size={16} />
          )}
          {t('Invite')}
        </Button>
      </AdminPageHeader>
      <AdminDataTable
        emptyStateTextTitle={
          hiddenUsersCount > 0
            ? t('No users match this filter')
            : t('No users found')
        }
        emptyStateTextDescription={
          hiddenUsersCount > 0
            ? t('usersHiddenByStatusFilter', { count: hiddenUsersCount })
            : t('Start inviting users to your project')
        }
        emptyStateIcon={<User />}
        columns={columns}
        filters={[
          {
            type: 'select',
            title: t('Status'),
            accessorKey: STATUS_FILTER_KEY,
            options: [
              { label: t('Activated'), value: UserStatus.ACTIVE },
              { label: t('Deactivated'), value: UserStatus.INACTIVE },
              { label: t('Invited'), value: INVITED_USER_STATUS },
            ],
            defaultValues: DEFAULT_STATUS_FILTER,
          },
        ]}
        page={{
          data: visibleRows,
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
      <InviteUserDialog
        open={inviteOpen}
        setOpen={setInviteOpen}
        onInviteSuccess={refetch}
      />
      {seatLimitDialog}
    </AdminPage>
  );
}

const STATUS_FILTER_KEY = 'status';

const STATUS_FILTER_VALUES: UserRowStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  INVITED_USER_STATUS,
];

const DEFAULT_STATUS_FILTER: UserRowStatus[] = [
  UserStatus.ACTIVE,
  INVITED_USER_STATUS,
];
