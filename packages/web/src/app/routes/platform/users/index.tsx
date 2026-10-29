import { isNil } from '@activepieces/core-utils';
import {
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Gem, User } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { LockedFeatureUsage } from '@/app/components/feature-sample';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  billingKeys,
  billingQueries,
  billingUtils,
  seatUtils,
  ActionWhenLocked,
  useLockedFeature,
  useSeatLimitGuard,
} from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

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
    canBuySeats,
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

  const { platform } = platformHooks.useCurrentPlatform();
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    true,
  );
  const activeUsers =
    subscription?.usage.users ??
    seatUtils.reservedSeats({
      users: usersData?.data ?? [],
      invitations: invitationsData ?? [],
    });
  const usersLimit = isNil(subscription)
    ? platform.plan.usersLimit
    : billingUtils.resolveSeatCap(subscription).effectiveLimit;
  const usersLockedFeature = useLockedFeature({
    unlocked: isNil(usersLimit) || activeUsers < usersLimit,
    featureKey: 'USERS',
  });

  const isLoading = usersLoading || invitationsLoading;
  const isError = usersError || invitationsError;

  const queryClient = useQueryClient();
  const refreshUsersAndSeats = () => {
    refetch();
    queryClient
      .invalidateQueries({
        queryKey: billingKeys.platformSubscription(platform.id),
      })
      .catch(() => undefined);
  };

  const { mutate: deleteUser } = platformUserMutations.useDeleteUser({
    onSuccess: refreshUsersAndSeats,
  });

  const { mutate: deleteInvitation } =
    platformUserMutations.useDeleteInvitation({
      onSuccess: refreshUsersAndSeats,
    });

  const { mutate: updateUserStatus, isPending: isUpdatingStatus } =
    platformUserMutations.useUpdateUserStatus({
      onSuccess: refreshUsersAndSeats,
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
        <LockedFeatureUsage
          featureKey="USERS"
          unlocked={!usersLockedFeature.locked}
          used={activeUsers}
          limit={usersLimit}
          label={t('users')}
        >
          <Button
            {...adminControl(AdminControl.USERS_INVITE_OPEN)}
            onClick={() => {
              if (
                usersLockedFeature.actionWhenLocked ===
                  ActionWhenLocked.START_TRIAL &&
                !canBuySeats
              ) {
                if (usersLockedFeature.locked) {
                  usersLockedFeature.showLockedDialog();
                } else {
                  setInviteOpen(true);
                }
                return;
              }
              if (ensureSeatsAvailable(1)) {
                setInviteOpen(true);
              }
            }}
          >
            {isOutOfSeats || usersLockedFeature.locked ? (
              <Gem className="text-on-accent/90" />
            ) : (
              <UserRoundPlusIcon size={16} />
            )}
            {t('Invite')}
          </Button>
        </LockedFeatureUsage>
      </AdminPageHeader>
      <AdminDataTable
        emptyStateTextTitle={t('No users found')}
        emptyStateTextDescription={t('Start inviting users to your project')}
        emptyStateIcon={<User />}
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
        onInviteSuccess={refreshUsersAndSeats}
      />
      {seatLimitDialog}
    </AdminPage>
  );
}
