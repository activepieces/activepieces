import {
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, User } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { DataTable } from '@/components/custom/data-table';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { useSeatLimitGuard } from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';

import { UserActions } from './actions/user-actions';
import { createUsersTableColumns } from './columns';

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
    <>
      <div className="flex flex-col w-full">
        <DashboardPageHeader
          title={t('Users')}
          description={t(
            'Manage, delete, activate and deactivate users on platform',
          )}
        />
        <DataTable
          emptyStateTextTitle={t('No users found')}
          emptyStateTextDescription={t('Start inviting users to your project')}
          emptyStateIcon={<User className="size-14" />}
          columns={columns}
          page={{
            data: combinedData,
            next: usersData?.next || null,
            previous: usersData?.previous || null,
          }}
          hidePagination={true}
          isLoading={isLoading}
          isError={isError}
          errorStateEntity={t('users')}
          onRetry={refetch}
          toolbarButtons={[
            <Button
              key="invite"
              className="gap-2"
              size="sm"
              onClick={() => {
                if (ensureSeatsAvailable(1)) {
                  setInviteOpen(true);
                }
              }}
            >
              {isOutOfSeats ? (
                <Crown className="size-4 shrink-0 text-primary-foreground/90" />
              ) : (
                <UserRoundPlusIcon size={16} />
              )}
              <span className="text-sm font-medium">{t('Invite')}</span>
            </Button>,
          ]}
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
      </div>
      <InviteUserDialog
        open={inviteOpen}
        setOpen={setInviteOpen}
        onInviteSuccess={refetch}
      />
      {seatLimitDialog}
    </>
  );
}
