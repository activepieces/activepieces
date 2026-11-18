import { isNil } from '@activepieces/core-utils';
import {
  INVITED_USER_STATUS,
  PlatformUserListItem,
  PlatformUserListStatus,
  UserStatus,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Gem, User } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
  adminPagination,
} from '@/app/components/admin';
import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { dataTableFilterUtils } from '@/components/custom/data-table/data-table-filter-utils';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  billingKeys,
  billingQueries,
  billingUtils,
  seatUtils,
  ActionWhenLocked,
  LockedFeatureUsage,
  useLockedFeature,
  useSeatLimitGuard,
} from '@/features/billing';
import { InviteUserDialog } from '@/features/members';
import {
  platformUserHooks,
  platformUserKeys,
  platformUserMutations,
} from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { UserActions } from './actions/user-actions';
import { createUsersTableColumns } from './columns';

export default function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isOutOfSeats, canBuySeats, handleSeatLimitError, seatLimitDialog } =
    useSeatLimitGuard();

  const [searchParams] = useSearchParams();
  const selectedStatuses = STATUS_FILTER_VALUES.filter((status) =>
    dataTableFilterUtils
      .getSelectedValues({
        searchParams,
        key: STATUS_FILTER_KEY,
        allowedValues: STATUS_FILTER_VALUES,
        defaultValues: DEFAULT_STATUS_FILTER,
      })
      .includes(status),
  );
  const isFiltered =
    selectedStatuses.length > 0 &&
    selectedStatuses.length < STATUS_FILTER_VALUES.length;

  const {
    data: usersPage,
    isLoading,
    isError,
    isPlaceholderData,
  } = platformUserHooks.useUsersWithInvitationsPage({
    statuses: selectedStatuses,
    cursor: searchParams.get(CURSOR_QUERY_PARAM) ?? undefined,
    limit: adminPagination.parseLimit(searchParams.get(LIMIT_QUERY_PARAM)),
  });

  const queryClient = useQueryClient();
  const refetch = () => {
    Promise.all([
      queryClient.invalidateQueries({ queryKey: platformUserKeys.users }),
      queryClient.invalidateQueries({
        queryKey: platformUserKeys.invitations,
      }),
    ]).catch(() => undefined);
  };

  const { data: usersData } = platformUserHooks.useUsers();
  const { data: invitationsData } = platformUserHooks.usePlatformInvitations();

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
                usersLockedFeature.locked &&
                usersLockedFeature.actionWhenLocked ===
                  ActionWhenLocked.START_TRIAL &&
                !canBuySeats
              ) {
                usersLockedFeature.showLockedDialog();
                return;
              }
              setInviteOpen(true);
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
        emptyStateTextTitle={
          isFiltered ? t('No users match this filter') : t('No users found')
        }
        emptyStateTextDescription={
          isFiltered
            ? t('Try changing the status filter')
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
        page={usersPage}
        hideFooterUntilNeeded
        isLoading={
          isLoading ||
          (isPlaceholderData && (usersPage?.data.length ?? 0) === 0)
        }
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

const STATUS_FILTER_KEY = 'status';

const STATUS_FILTER_VALUES: PlatformUserListStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  INVITED_USER_STATUS,
];

const DEFAULT_STATUS_FILTER: PlatformUserListStatus[] = [
  UserStatus.ACTIVE,
  INVITED_USER_STATUS,
];

export type UserRowData = PlatformUserListItem;
