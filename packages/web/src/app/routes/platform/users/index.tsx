import { isNil } from '@activepieces/core-utils';
import {
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, User } from 'lucide-react';
import { useMemo, useState } from 'react';

import { platformUserApi } from '@/api/platform-user-api';
import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
  ConfirmDialog,
  useAdminAction,
} from '@/app/components/admin';
import { EnterpriseGate } from '@/app/components/enterprise-gate';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import {
  billingQueries,
  seatUtils,
  useEnterpriseGate,
  useSeatLimitGuard,
} from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import { userInvitationApi } from '@/features/members/api/user-invitation';
import {
  platformUserHooks,
  platformUserKeys,
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
  const [deleteTarget, setDeleteTarget] = useState<UserRowData | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  const usersLimit = platform.plan.usersLimit;
  const usersGate = useEnterpriseGate({
    unlocked: isNil(usersLimit) || activeUsers < usersLimit,
    featureKey: 'USERS',
  });

  const isLoading = usersLoading || invitationsLoading;
  const isError =
    (usersError && usersData === undefined) ||
    (invitationsError && invitationsData === undefined);

  const invalidate = [platformUserKeys.users, platformUserKeys.invitations];

  const deleteRow = useAdminAction<UserRowData>({
    verb: 'delete',
    name: (row) => row.data.email,
    run: async (row) => {
      if (row.type === 'invitation') {
        await userInvitationApi.delete(row.id);
      } else {
        await platformUserApi.delete(row.data.id);
      }
    },
    invalidate,
  });

  const setStatus = useAdminAction<StatusChange>({
    verb: ({ status }) =>
      status === UserStatus.ACTIVE ? 'activate' : 'deactivate',
    name: ({ email }) => email,
    run: ({ userId, status }) => platformUserApi.update(userId, { status }),
    undo: ({ vars }) =>
      platformUserApi.update(vars.userId, {
        status:
          vars.status === UserStatus.ACTIVE
            ? UserStatus.INACTIVE
            : UserStatus.ACTIVE,
      }),
    handleError: handleSeatLimitError,
    invalidate,
  });

  const handleToggleStatus = (user: UserWithMetaInformation) => {
    setStatus.mutate({
      userId: user.id,
      email: user.email,
      status:
        user.status === UserStatus.ACTIVE
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
        <EnterpriseGate
          mode="limit"
          featureKey="USERS"
          unlocked={!usersGate.locked}
          used={activeUsers}
          limit={usersLimit}
          label={t('users')}
        >
          <Button
            {...adminControl(AdminControl.USERS_INVITE_OPEN)}
            onClick={() => {
              if (usersGate.access === 'trial_available' && !canBuySeats) {
                usersGate.run(() => setInviteOpen(true), {
                  resumable: false,
                });
                return;
              }
              if (ensureSeatsAvailable(1)) {
                setInviteOpen(true);
              }
            }}
          >
            {isOutOfSeats || usersGate.locked ? (
              <Gem className="text-on-accent/90" />
            ) : (
              <UserRoundPlusIcon size={16} />
            )}
            {t('Invite')}
          </Button>
        </EnterpriseGate>
      </AdminPageHeader>
      <AdminDataTable
        emptyStateTextTitle={t('No users found')}
        emptyStateTextDescription={t('Start inviting users to your project')}
        emptyStateIcon={<User />}
        columns={columns}
        page={{
          data: isError ? [] : combinedData,
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
              isUpdatingStatus={
                setStatus.isPending && setStatus.variables?.userId === row.id
              }
              onDelete={(row) => {
                setDeleteTarget(row);
                setDeleteOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
              onUpdate={refetch}
            />
          ),
        ]}
      />
      {deleteTarget && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={
            deleteTarget.type === 'invitation'
              ? t('Delete the invitation for {email}?', {
                  email: deleteTarget.data.email,
                })
              : t('Delete {email}?', { email: deleteTarget.data.email })
          }
          description={
            deleteTarget.type === 'invitation'
              ? t('This invitation will be permanently deleted.')
              : t('This user and all their data will be permanently deleted.')
          }
          confirmLabel={
            deleteTarget.type === 'invitation'
              ? t('Delete Invitation')
              : t('Delete User')
          }
          onConfirm={() => deleteRow.mutateAsync(deleteTarget)}
          controlId={AdminControl.USERS_DELETE_CONFIRM}
        />
      )}
      <InviteUserDialog
        open={inviteOpen}
        setOpen={setInviteOpen}
        onInviteSuccess={refetch}
        adminFeedback
      />
      {seatLimitDialog}
    </AdminPage>
  );
}

type StatusChange = {
  userId: string;
  email: string;
  status: UserStatus;
};
