import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { User, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { InviteUserDialog } from '@/features/members/component/invite-user/invite-user-dialog';
import { userInvitationApi } from '@/features/members/lib/user-invitation';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { platformUserApi } from '@/lib/platform-user-api';
import {
  InvitationType,
  UserInvitation,
  UserStatus,
  UserWithMetaInformation,
} from '@activepieces/shared';

import { DeleteUserAction } from './actions/delete-user-action';
import { EditUserAction } from './actions/edit-user-action';
import { ToggleUserStatusAction } from './actions/toggle-user-status-action';
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
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = platformUserHooks.useUsers();

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useQuery<UserInvitation[]>({
    queryFn: () => {
      return userInvitationApi
        .list({
          type: InvitationType.PLATFORM,
          cursor: undefined,
          limit: 100,
          projectId: null,
        })
        .then((res) => res.data);
    },
    queryKey: ['platform-invitations'],
    staleTime: 0,
  });

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

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-user'],
    mutationFn: async (userId: string) => {
      await platformUserApi.delete(userId);
    },
    onSuccess: () => {
      refetch();
      toast.success(t('User deleted successfully'), {
        duration: 3000,
      });
    },
  });

  const { mutate: deleteInvitation, isPending: isDeletingInvitation } =
    useMutation({
      mutationKey: ['delete-invitation'],
      mutationFn: async (invitationId: string) => {
        await userInvitationApi.delete(invitationId);
      },
      onSuccess: () => {
        refetch();
        toast.success(t('Invitation deleted successfully'), {
          duration: 3000,
        });
      },
    });

  const { mutate: updateUserStatus, isPending: isUpdatingStatus } = useMutation(
    {
      mutationFn: async (data: { userId: string; status: UserStatus }) => {
        await platformUserApi.update(data.userId, {
          status: data.status,
        });
        return {
          userId: data.userId,
          status: data.status,
        };
      },
      onSuccess: (data) => {
        refetch();
        toast.success(
          data.status === UserStatus.ACTIVE
            ? t('User activated successfully')
            : t('User deactivated successfully'),
          {
            duration: 3000,
          },
        );
      },
    },
  );

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
    <LockedFeatureGuard
      featureKey="USERS"
      locked={false}
      lockTitle={t('Unlock Users')}
      lockDescription={t('Manage your users and their access to your projects')}
    >
      <div className="flex flex-col w-full">
        <DashboardPageHeader
          title={t('Users')}
          description={t(
            'Manage, delete, activate and deactivate users on platform',
          )}
        >
          <Button
            className="gap-2"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-medium">{t('Invite')}</span>
          </Button>
        </DashboardPageHeader>
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
          actions={[
            (row) => <EditUserAction row={row} onUpdate={refetch} />,
            (row) => (
              <ToggleUserStatusAction
                row={row}
                isUpdatingStatus={isUpdatingStatus}
                onToggleStatus={handleToggleStatus}
              />
            ),
            (row) => (
              <DeleteUserAction
                row={row}
                isDeleting={isDeleting || isDeletingInvitation}
                onDelete={handleDelete}
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
    </LockedFeatureGuard>
  );
}
